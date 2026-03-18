import { InlineKeyboard } from "grammy";
import { MyContext, MyConversation } from "../types";
import { t } from "../locales";
import {
  getAllAdminCredentials,
  createCredential,
  findCredentialByLogin,
  updateCredentialLoginPassword,
  deactivateCredential,
} from "../db";

// ── /add_admin ────────────────────────────────────────────────────────────────

export async function addAdminConversation(
  conversation: MyConversation,
  ctx: MyContext
): Promise<void> {
  const lang = ctx.session.lang;

  await ctx.reply(t(lang, "add_admin_prompt_login"));
  const loginCtx = await conversation.waitFor("message:text");
  const login = loginCtx.message.text.trim();

  const exists = await conversation.external(() => findCredentialByLogin(login));
  if (exists) {
    await ctx.reply(t(lang, "add_admin_login_exists", { login }));
    return;
  }

  await ctx.reply(t(lang, "add_admin_prompt_password"));
  const passwordCtx = await conversation.waitFor("message:text");
  const password = passwordCtx.message.text.trim();

  await conversation.external(() => createCredential(login, password, "admin"));

  await ctx.reply(t(lang, "add_admin_success", { login }));
}

// ── /update_admin ─────────────────────────────────────────────────────────────

export async function updateAdminConversation(
  conversation: MyConversation,
  ctx: MyContext
): Promise<void> {
  const lang = ctx.session.lang;

  const admins = await conversation.external(() => getAllAdminCredentials());

  if (admins.length === 0) {
    await ctx.reply(t(lang, "update_admin_no_admins"));
    return;
  }

  const kb = new InlineKeyboard();
  for (const a of admins) {
    const label = `${a.is_active ? "🟢" : "🔴"} ${a.login}`;
    kb.text(label, `updadmin:${a.id}`).row();
  }

  await ctx.reply(t(lang, "update_admin_select"), { reply_markup: kb });

  const selCtx = await conversation.waitFor("callback_query:data");
  await selCtx.answerCallbackQuery();
  const adminId = parseInt(selCtx.callbackQuery.data.split(":")[1], 10);

  const admin = admins.find((a) => a.id === adminId);
  if (!admin) return;

  await ctx.reply(t(lang, "update_admin_prompt_login", { login: admin.login }));
  const loginCtx = await conversation.waitFor("message:text");
  const newLogin = loginCtx.message.text.trim();

  await ctx.reply(t(lang, "update_admin_prompt_password"));
  const passwordCtx = await conversation.waitFor("message:text");
  const newPassword = passwordCtx.message.text.trim();

  await conversation.external(() => updateCredentialLoginPassword(adminId, newLogin, newPassword));

  await ctx.reply(t(lang, "update_admin_success", { login: newLogin }));
}

// ── /delete_admin ─────────────────────────────────────────────────────────────

export async function deleteAdminConversation(
  conversation: MyConversation,
  ctx: MyContext
): Promise<void> {
  const lang = ctx.session.lang;
  const selfId = ctx.session.credentialId!;

  const admins = await conversation.external(() =>
    getAllAdminCredentials().filter((a) => a.is_active === 1 && a.id !== selfId)
  );

  if (admins.length === 0) {
    await ctx.reply(t(lang, "delete_admin_no_admins"));
    return;
  }

  const kb = new InlineKeyboard();
  for (const a of admins) {
    kb.text(a.login, `deladmin:${a.id}`).row();
  }

  await ctx.reply(t(lang, "delete_admin_select"), { reply_markup: kb });

  const selCtx = await conversation.waitFor("callback_query:data");
  await selCtx.answerCallbackQuery();
  const adminId = parseInt(selCtx.callbackQuery.data.split(":")[1], 10);

  const admin = admins.find((a) => a.id === adminId);
  if (!admin) return;

  await conversation.external(() => deactivateCredential(adminId));

  await ctx.reply(t(lang, "delete_admin_success", { login: admin.login }));
}

// ── /list_admins ──────────────────────────────────────────────────────────────

export async function handleListAdmins(ctx: MyContext): Promise<void> {
  const lang = ctx.session.lang;
  const admins = getAllAdminCredentials();

  if (admins.length === 0) {
    await ctx.reply(t(lang, "list_admins_empty"));
    return;
  }

  const rows = admins.map((a) => {
    const status = a.is_active ? t(lang, "admin_active") : t(lang, "admin_inactive");
    return t(lang, "admin_row", { status, login: a.login });
  });

  await ctx.reply(t(lang, "list_admins_header") + rows.join("\n"));
}
