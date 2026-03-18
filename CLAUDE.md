# Ticket Bot — CLAUDE.md

## Project Overview

A Telegram bot for Aviasales ticket management, built with **grammY + TypeScript + Node.js + SQLite3**.

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Telegram framework**: grammY v1 + `@grammyjs/conversations` v1
- **Database**: SQLite3 via `better-sqlite3` (WAL mode)
- **Password hashing**: `bcryptjs`
- **Excel export**: `exceljs`
- **Languages supported**: Uzbek (`uz`), Russian (`ru`), English (`en`)

## Roles

| Role   | Capabilities |
|--------|-------------|
| admin  | Manage admins, branches, managers; view all clients/statistics; export Excel |
| branch | Add/view/manage clients of their own branch only |

> Managers are **not** login users — they are named entities assigned to branches and selected when adding clients.

## Database Schema

### `credentials`
| Column    | Type    | Notes                       |
|-----------|---------|-----------------------------|
| id        | INTEGER | Primary key                 |
| login     | TEXT    | Unique                      |
| password  | TEXT    | bcrypt hashed               |
| type      | TEXT    | `admin` or `branch`         |
| is_active | INTEGER | Default 1                   |

### `branches`
| Column        | Type    | Notes                       |
|---------------|---------|-----------------------------|
| id            | INTEGER | Primary key                 |
| name          | TEXT    |                             |
| latitude      | REAL    |                             |
| longitude     | REAL    |                             |
| credential_id | INTEGER | FK → credentials.id         |

### `managers`
| Column    | Type    | Notes                       |
|-----------|---------|-----------------------------|
| id        | INTEGER | Primary key                 |
| name      | TEXT    |                             |
| branch_id | INTEGER | FK → branches.id            |
| is_active | INTEGER | Default 1                   |

### `clients`
| Column         | Type     | Notes                                  |
|----------------|----------|----------------------------------------|
| id             | INTEGER  | Primary key                            |
| name           | TEXT     |                                        |
| phone          | TEXT     |                                        |
| direction_name | TEXT     |                                        |
| buying_status  | TEXT     | `in_progress`, `sale`, `cancelled`     |
| branch_id      | INTEGER  | FK → branches.id                       |
| manager_id     | INTEGER  | FK → managers.id                       |
| created_at     | DATETIME | Default `datetime('now')`              |

## Bot Commands

| Command                 | Access        | Description |
|-------------------------|---------------|-------------|
| `/start`                | all           | Language selection (inline keyboard); if logged in, show role menu |
| `/login`                | all           | Prompt login + password; authenticate `admin` or `branch` |
| `/logout`               | all           | Clear session and return to guest keyboard |
| `/cancel`               | all           | Exit active conversation, return to menu |
| `/change_language`      | all           | Show language selection (same as `/start`) |
| `/add_branch`           | admin         | Name → Telegram location → login → password; creates branch + `branch` credential |
| `/update_branch`        | admin         | Select branch (inline) → update name / location / login / password |
| `/delete_branch`        | admin         | Select branch (inline) → set credential `is_active = 0` (soft delete) |
| `/list_branches`        | admin         | List all branches; inactive marked with 🔴 |
| `/add_manager`          | admin         | Enter name → select branch (inline) → save manager |
| `/update_manager`       | admin         | Select manager (inline) → update name / branch |
| `/delete_manager`       | admin         | Select manager (inline) → set `is_active = 0` (soft delete) |
| `/list_managers`        | admin         | List all managers with branch; inactive marked with 🔴 |
| `/add_admin`            | admin         | Enter login + password → create admin credential |
| `/update_admin`         | admin         | Select admin (inline) → update login + password |
| `/delete_admin`         | admin         | Select admin (inline) → soft delete; cannot delete own account |
| `/list_admins`          | admin         | List all admins; inactive marked with 🔴 |
| `/add_client`           | branch        | Phone → name → direction → select manager (inline) → save with `in_progress`; success reply shows inline ✅/❌ status buttons |
| `/get_client_info`      | auth required | Enter client ID → show info; if `in_progress`, show inline status buttons |
| `/change_client_status` | branch        | Show `in_progress` clients as one-time reply keyboard → tap client → inline sale/cancelled → alert popup on confirm → edit message in place → loop |
| `/list_clients`         | auth required | Branch: own clients. Admin: select branch (inline, "All branches" option) → list |
| `/statistics`           | admin         | Calendar (start) → calendar (end) → branch (inline, "All branches") → totals by status and by manager, filtered by `created_at` |
| `/import`               | admin         | Same flow as `/statistics` → export to `.xlsx` file |

## Session Management

grammY conversations v1 uses record-and-replay; `ctx.session` mutations inside a conversation are unreliable.

**Pattern used:**
- `authStore` (`src/authStore.ts`) — plain `Map<chatId, AuthData>` is the source of truth for auth state.
- Restore middleware in `bot.ts` runs **unconditionally** on every update (no `!ctx.session.credentialId` guard) to copy `authStore` data into `ctx.session` before any handler runs.
- On login: write to both `ctx.session` and `authStore` inside `conversation.external()`.
- On logout: clear both `ctx.session` fields and `authStore`.
- `lang` preference is stored only in `ctx.session` (safe — not auth-critical).

## i18n

- Language stored per chat in `ctx.session.lang`; default `en`.
- All messages available in `uz`, `ru`, `en` under `src/locales/`.
- `t(lang, key, params?)` helper interpolates `{placeholder}` values.
- `allVariants(key)` returns `[en[key], ru[key], uz[key]]` for `bot.hears()` registration.

## UI / UX Rules

- After every command, show the role-appropriate **persistent** reply keyboard (`buildMenuKeyboard`) or guest keyboard.
- Branch/manager/admin selection always uses **inline keyboard** (never free-text).
- `/change_client_status` uses a **one-time reply keyboard** (`Keyboard().oneTime().resized()`) for client selection.
- Status change confirmation shown as a Telegram **alert popup** (`answerCallbackQuery({ show_alert: true })`).
- After status change, **edit the inline-keyboard message** in place to update the status text and remove the keyboard.
- "All branches" button is always last in branch selection menus for `/list_clients`, `/statistics`, `/import`.

## Project Structure

```
ticket_bot/
├── src/
│   ├── bot.ts                    # Bot entry point; middleware, conversation registration, all handlers
│   ├── db.ts                     # SQLite setup, schema, all query functions
│   ├── types.ts                  # TypeScript types: SessionData, DbCredential, DbBranch, DbManager, DbClient
│   ├── authStore.ts              # In-memory auth Map (source of truth for auth state)
│   ├── commands/
│   │   ├── start.ts              # handleStart, handleLangCallback
│   │   ├── login.ts              # loginConversation
│   │   ├── logout.ts             # handleLogout
│   │   ├── admin.ts              # addAdminConversation, updateAdminConversation, deleteAdminConversation, handleListAdmins
│   │   ├── branch.ts             # addBranchConversation, updateBranchConversation, deleteBranchConversation, handleListBranches
│   │   ├── manager.ts            # addManagerConversation, updateManagerConversation, deleteManagerConversation, handleListManagers
│   │   ├── ticket.ts             # addClientConversation, listClientsConversation, getClientInfoConversation, changeClientStatusConversation
│   │   ├── statistics.ts         # statisticsConversation
│   │   └── import_excel.ts       # importConversation
│   ├── utils/
│   │   ├── keyboard.ts           # buildMenuKeyboard, buildGuestKeyboard, allVariants
│   │   └── calendar.ts           # pickDate (inline calendar for date range selection)
│   └── locales/
│       ├── index.ts              # t(lang, key, params) helper
│       ├── en.ts
│       ├── ru.ts
│       └── uz.ts
├── .env                          # BOT_TOKEN (not committed)
├── env.example                   # Example env file
├── data.db                       # SQLite database (not committed)
├── CLAUDE.md
├── requirements.txt
├── package.json
├── package-lock.json
└── tsconfig.json
```

## Key Constraints

- Passwords are **bcrypt-hashed** — never store or compare plaintext.
- `/change_client_status` only allows `in_progress → sale` or `in_progress → cancelled`; any other transition is rejected.
- `/delete_branch` and `/delete_manager` are **soft deletes** — set `is_active = 0`, never hard delete rows.
- `/delete_admin` cannot deactivate the currently logged-in admin's own account.
- Branch users can only see and manage clients belonging to their own `branchId`.
- `/statistics` and `/import` filter by `created_at` date range; "All branches" groups results by branch.
- `/import` produces a downloadable `.xlsx` file via `exceljs`.
- Default admin seeded on first run: login `admin` / password `admin123`.
