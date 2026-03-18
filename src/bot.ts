import "dotenv/config";
import { Bot, session } from "grammy";
import { conversations, createConversation } from "@grammyjs/conversations";

import { MyContext, SessionData } from "./types";
import { t } from "./locales";
import { authStore } from "./authStore";

import { handleStart } from "./commands/start";
import { buildMenuKeyboard, buildAdminSubKeyboard, buildGuestKeyboard, allVariants } from "./utils/keyboard";
import { loginConversation } from "./commands/login";
import { handleLogout } from "./commands/logout";
import {
  addAdminConversation,
  updateAdminConversation,
  deleteAdminConversation,
  handleListAdmins,
} from "./commands/admin";
import {
  addBranchConversation,
  updateBranchConversation,
  deleteBranchConversation,
  handleListBranches,
} from "./commands/branch";
import {
  addManagerConversation,
  updateManagerConversation,
  deleteManagerConversation,
  handleListManagers,
} from "./commands/manager";
import {
  addClientConversation,
  listClientsConversation,
  changeClientStatusConversation,
} from "./commands/ticket";
import { statisticsConversation } from "./commands/statistics";
import { importConversation, branchImportConversation } from "./commands/import_excel";

const token = process.env.BOT_TOKEN;
if (!token) throw new Error("BOT_TOKEN is not set in environment variables");

const bot = new Bot<MyContext>(token);

// ── Middleware ────────────────────────────────────────────────────────────────

bot.use(
  session<SessionData, MyContext>({
    initial: (): SessionData => ({ lang: "uz" }),
  })
);

// Restore auth from the global store on every update (fixes grammY session+conversation quirks)
bot.use(async (ctx, next) => {
  const chatId = ctx.chat?.id ?? ctx.from?.id;
  if (chatId) {
    const auth = authStore.get(chatId);
    if (auth) {
      ctx.session.credentialId = auth.credentialId;
      ctx.session.login = auth.login;
      ctx.session.type = auth.type;
      ctx.session.branchId = auth.branchId;
    }
  }
  await next();
});

// Cancel interceptor — must run before conversations() so active conversations don't swallow the update
bot.use(async (ctx, next) => {
  const text = ctx.message?.text ?? "";
  const cancelTexts = allVariants("btn_menu_cancel");
  const isCancel = text === "/cancel" || cancelTexts.includes(text);

  if (isCancel) {
    (ctx.session as any).conversation = undefined;
    const lang = ctx.session.lang;
    const keyboard = ctx.session.credentialId
      ? buildMenuKeyboard(ctx.session.type!, lang)
      : buildGuestKeyboard(lang);
    await ctx.reply(t(lang, "cancelled"), { reply_markup: keyboard });
    return;
  }

  await next();
});

bot.use(conversations());

// Register all conversations
bot.use(createConversation(loginConversation));
bot.use(createConversation(addAdminConversation));
bot.use(createConversation(updateAdminConversation));
bot.use(createConversation(deleteAdminConversation));
bot.use(createConversation(addBranchConversation));
bot.use(createConversation(updateBranchConversation));
bot.use(createConversation(deleteBranchConversation));
bot.use(createConversation(addManagerConversation));
bot.use(createConversation(updateManagerConversation));
bot.use(createConversation(deleteManagerConversation));
bot.use(createConversation(addClientConversation));
bot.use(createConversation(listClientsConversation));
bot.use(createConversation(changeClientStatusConversation));
bot.use(createConversation(statisticsConversation));
bot.use(createConversation(importConversation));
bot.use(createConversation(branchImportConversation));

// ── Helpers ───────────────────────────────────────────────────────────────────

async function requireAuth(ctx: MyContext): Promise<boolean> {
  if (!ctx.session.credentialId) {
    await ctx.reply(t(ctx.session.lang, "not_logged_in"), {
      reply_markup: buildGuestKeyboard(ctx.session.lang),
    });
    return false;
  }
  return true;
}

async function requireAdmin(ctx: MyContext): Promise<boolean> {
  if (!(await requireAuth(ctx))) return false;
  if (ctx.session.type !== "admin") {
    await ctx.reply(t(ctx.session.lang, "unauthorized"), {
      reply_markup: buildGuestKeyboard(ctx.session.lang),
    });
    return false;
  }
  return true;
}

async function requireBranch(ctx: MyContext): Promise<boolean> {
  if (!(await requireAuth(ctx))) return false;
  if (ctx.session.type !== "branch") {
    await ctx.reply(t(ctx.session.lang, "unauthorized"), {
      reply_markup: buildGuestKeyboard(ctx.session.lang),
    });
    return false;
  }
  return true;
}

// ── Commands ──────────────────────────────────────────────────────────────────

bot.command("start", handleStart);
bot.command("login", (ctx) => ctx.conversation.enter("loginConversation"));
bot.command("logout", handleLogout);

bot.command("cancel", (ctx) => {}); // handled by pre-conversations interceptor

// Admin management (admin only)
bot.command("add_admin", async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  await ctx.conversation.enter("addAdminConversation");
});

bot.command("update_admin", async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  await ctx.conversation.enter("updateAdminConversation");
});

bot.command("delete_admin", async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  await ctx.conversation.enter("deleteAdminConversation");
});

bot.command("list_admins", async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  await handleListAdmins(ctx);
});

// Branch management (admin only)
bot.command("add_branch", async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  await ctx.conversation.enter("addBranchConversation");
});

bot.command("update_branch", async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  await ctx.conversation.enter("updateBranchConversation");
});

bot.command("delete_branch", async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  await ctx.conversation.enter("deleteBranchConversation");
});

bot.command("list_branches", async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  await handleListBranches(ctx);
});

// Manager management (admin only)
bot.command("add_manager", async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  await ctx.conversation.enter("addManagerConversation");
});

bot.command("update_manager", async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  await ctx.conversation.enter("updateManagerConversation");
});

bot.command("delete_manager", async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  await ctx.conversation.enter("deleteManagerConversation");
});

bot.command("list_managers", async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  await handleListManagers(ctx);
});

// Client commands (branch only for add/change; admin+branch for list/info)
bot.command("add_client", async (ctx) => {
  if (!(await requireBranch(ctx))) return;
  await ctx.conversation.enter("addClientConversation");
});

bot.command("list_clients", async (ctx) => {
  if (!(await requireAuth(ctx))) return;
  await ctx.conversation.enter("listClientsConversation");
});

bot.command("change_client_status", async (ctx) => {
  if (!(await requireBranch(ctx))) return;
  await ctx.conversation.enter("changeClientStatusConversation");
});

// Statistics & import (admin only)
bot.command("statistics", async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  await ctx.conversation.enter("statisticsConversation");
});

bot.command("import", async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  await ctx.conversation.enter("importConversation");
});

// ── Menu button hears ─────────────────────────────────────────────────────────

bot.hears(allVariants("btn_menu_start"), handleStart);
bot.hears(allVariants("btn_menu_login"), (ctx) => ctx.conversation.enter("loginConversation"));

// btn_menu_cancel is handled by pre-conversations interceptor

bot.hears(allVariants("btn_menu_logout"), handleLogout);

// Admin sub-menu group buttons
bot.hears(allVariants("btn_menu_admin_management"), async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  const lang = ctx.session.lang;
  await ctx.reply(t(lang, "btn_menu_admin_management"), {
    reply_markup: buildAdminSubKeyboard("admin", lang),
  });
});

bot.hears(allVariants("btn_menu_branch_management"), async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  const lang = ctx.session.lang;
  await ctx.reply(t(lang, "btn_menu_branch_management"), {
    reply_markup: buildAdminSubKeyboard("branch", lang),
  });
});

bot.hears(allVariants("btn_menu_manager_management"), async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  const lang = ctx.session.lang;
  await ctx.reply(t(lang, "btn_menu_manager_management"), {
    reply_markup: buildAdminSubKeyboard("manager", lang),
  });
});

// Back button — return to main admin menu
bot.hears(allVariants("btn_menu_back"), async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  const lang = ctx.session.lang;
  await ctx.reply(t(lang, "welcome"), {
    reply_markup: buildMenuKeyboard("admin", lang),
  });
});

// Admin management buttons
bot.hears(allVariants("btn_menu_add_admin"), async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  await ctx.conversation.enter("addAdminConversation");
});

bot.hears(allVariants("btn_menu_update_admin"), async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  await ctx.conversation.enter("updateAdminConversation");
});

bot.hears(allVariants("btn_menu_delete_admin"), async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  await ctx.conversation.enter("deleteAdminConversation");
});

bot.hears(allVariants("btn_menu_list_admins"), async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  await handleListAdmins(ctx);
});

// Branch buttons (admin)
bot.hears(allVariants("btn_menu_add_branch"), async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  await ctx.conversation.enter("addBranchConversation");
});

bot.hears(allVariants("btn_menu_update_branch"), async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  await ctx.conversation.enter("updateBranchConversation");
});

bot.hears(allVariants("btn_menu_delete_branch"), async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  await ctx.conversation.enter("deleteBranchConversation");
});

bot.hears(allVariants("btn_menu_list_branches"), async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  await handleListBranches(ctx);
});

// Manager buttons (admin)
bot.hears(allVariants("btn_menu_add_manager"), async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  await ctx.conversation.enter("addManagerConversation");
});

bot.hears(allVariants("btn_menu_update_manager"), async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  await ctx.conversation.enter("updateManagerConversation");
});

bot.hears(allVariants("btn_menu_delete_manager"), async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  await ctx.conversation.enter("deleteManagerConversation");
});

bot.hears(allVariants("btn_menu_list_managers"), async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  await handleListManagers(ctx);
});

// Client buttons
bot.hears(allVariants("btn_menu_add_client"), async (ctx) => {
  if (!(await requireBranch(ctx))) return;
  await ctx.conversation.enter("addClientConversation");
});

bot.hears(allVariants("btn_menu_list_clients"), async (ctx) => {
  if (!(await requireAuth(ctx))) return;
  await ctx.conversation.enter("listClientsConversation");
});

bot.hears(allVariants("btn_menu_change_client_status"), async (ctx) => {
  if (!(await requireBranch(ctx))) return;
  await ctx.conversation.enter("changeClientStatusConversation");
});

// Statistics & import (admin)
bot.hears(allVariants("btn_menu_statistics"), async (ctx) => {
  if (!(await requireAdmin(ctx))) return;
  await ctx.conversation.enter("statisticsConversation");
});

// Import Excel — routes by role (admin → full export, branch → own branch export)
bot.hears(allVariants("btn_menu_import"), async (ctx) => {
  if (!(await requireAuth(ctx))) return;
  if (ctx.session.type === "admin") {
    await ctx.conversation.enter("importConversation");
  } else if (ctx.session.type === "branch") {
    await ctx.conversation.enter("branchImportConversation");
  }
});

// Catch-all for unrecognized messages — restores the correct keyboard
bot.on("message:text", async (ctx) => {
  const lang = ctx.session.lang;
  if (!ctx.session.credentialId) {
    await ctx.reply(t(lang, "not_logged_in"), { reply_markup: buildGuestKeyboard(lang) });
  } else {
    await ctx.reply(t(lang, "welcome"), { reply_markup: buildMenuKeyboard(ctx.session.type!, lang) });
  }
});

// ── Callback queries ──────────────────────────────────────────────────────────


// Catch-all for unhandled callbacks
bot.on("callback_query", (ctx) => ctx.answerCallbackQuery());

// ── Error handler ─────────────────────────────────────────────────────────────

bot.catch((err) => {
  console.error("Bot error:", err);
});

// ── Start ─────────────────────────────────────────────────────────────────────

bot.start();
console.log("Bot is running…");
