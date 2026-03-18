import { InlineKeyboard, Keyboard } from "grammy";
import { MyContext, MyConversation } from "../types";
import { t } from "../locales";
import {
  getAllBranches,
  getAllManagers,
  createManager,
  getManagerById,
  updateManager,
  deactivateManager,
} from "../db";

// ── /add_manager ──────────────────────────────────────────────────────────────

export async function addManagerConversation(
  conversation: MyConversation,
  ctx: MyContext
): Promise<void> {
  const lang = ctx.session.lang;
  const cancelKb = new Keyboard().text(t(lang, "btn_menu_cancel")).resized();
  const branches = getAllBranches();

  if (branches.length === 0) {
    await ctx.reply(t(lang, "add_manager_no_branches"));
    return;
  }

  await ctx.reply(t(lang, "add_manager_prompt_name"), { reply_markup: cancelKb });
  const nameCtx = await conversation.waitFor("message:text");
  const name = nameCtx.message.text.trim();

  const kb = new InlineKeyboard();
  for (const b of branches) {
    kb.text(b.name, `addmgr:${b.id}`).row();
  }

  await ctx.reply(t(lang, "add_manager_select_branch"), { reply_markup: kb });

  const selCtx = await conversation.waitFor("callback_query:data");
  await selCtx.answerCallbackQuery();
  const branchId = parseInt(selCtx.callbackQuery.data.split(":")[1], 10);

  const branch = branches.find((b) => b.id === branchId);
  createManager(name, branchId);

  await ctx.reply(t(lang, "add_manager_success", { name, branch: branch?.name ?? "" }));
}

// ── /update_manager ───────────────────────────────────────────────────────────

export async function updateManagerConversation(
  conversation: MyConversation,
  ctx: MyContext
): Promise<void> {
  const lang = ctx.session.lang;
  const managers = getAllManagers();

  if (managers.length === 0) {
    await ctx.reply(t(lang, "update_manager_no_managers"));
    return;
  }

  const mgKb = new InlineKeyboard();
  for (const m of managers) {
    const label = `${m.is_active ? "🟢" : "🔴"} ${m.name} (${m.branch_name ?? "—"})`;
    mgKb.text(label, `updmgr:${m.id}`).row();
  }

  await ctx.reply(t(lang, "update_manager_select"), { reply_markup: mgKb });

  const selCtx = await conversation.waitFor("callback_query:data");
  await selCtx.answerCallbackQuery();
  const managerId = parseInt(selCtx.callbackQuery.data.split(":")[1], 10);

  const manager = getManagerById(managerId);
  if (!manager) return;

  const cancelKb = new Keyboard().text(t(lang, "btn_menu_cancel")).resized();

  await ctx.reply(t(lang, "update_manager_prompt_name", { name: manager.name }), { reply_markup: cancelKb });
  const nameCtx = await conversation.waitFor("message:text");
  const newName = nameCtx.message.text.trim();

  const branches = getAllBranches();
  const brKb = new InlineKeyboard();
  for (const b of branches) {
    brKb.text(b.name, `updmgrbr:${b.id}`).row();
  }

  await ctx.reply(t(lang, "update_manager_select_branch"), { reply_markup: brKb });

  const brSelCtx = await conversation.waitFor("callback_query:data");
  await brSelCtx.answerCallbackQuery();
  const newBranchId = parseInt(brSelCtx.callbackQuery.data.split(":")[1], 10);

  updateManager(managerId, newName, newBranchId);

  await ctx.reply(t(lang, "update_manager_success", { name: newName }));
}

// ── /delete_manager ───────────────────────────────────────────────────────────

export async function deleteManagerConversation(
  conversation: MyConversation,
  ctx: MyContext
): Promise<void> {
  const lang = ctx.session.lang;
  const managers = getAllManagers().filter((m) => m.is_active === 1);

  if (managers.length === 0) {
    await ctx.reply(t(lang, "delete_manager_select"));
    return;
  }

  const kb = new InlineKeyboard();
  for (const m of managers) {
    kb.text(`${m.name} (${m.branch_name ?? "—"})`, `delmgr:${m.id}`).row();
  }

  await ctx.reply(t(lang, "delete_manager_select"), { reply_markup: kb });

  const selCtx = await conversation.waitFor("callback_query:data");
  await selCtx.answerCallbackQuery();
  const managerId = parseInt(selCtx.callbackQuery.data.split(":")[1], 10);

  const manager = getManagerById(managerId);
  if (!manager) return;

  deactivateManager(managerId);

  await ctx.reply(t(lang, "delete_manager_success", { name: manager.name }));
}

// ── /list_managers ────────────────────────────────────────────────────────────

export async function handleListManagers(ctx: MyContext): Promise<void> {
  const lang = ctx.session.lang;
  const managers = getAllManagers();

  if (managers.length === 0) {
    await ctx.reply(t(lang, "list_managers_empty"));
    return;
  }

  const rows = managers.map((m) => {
    const status = m.is_active ? t(lang, "manager_active") : t(lang, "manager_inactive");
    return t(lang, "manager_row", { status, name: m.name, branch: m.branch_name ?? "—" });
  });

  await ctx.reply(t(lang, "list_managers_header") + rows.join("\n"));
}
