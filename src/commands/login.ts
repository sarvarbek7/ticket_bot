import { Keyboard } from "grammy";
import { MyContext, MyConversation } from "../types";
import { t } from "../locales";
import { findCredentialByLogin, verifyPassword, getBranchByCredentialId } from "../db";
import { buildMenuKeyboard } from "../utils/keyboard";
import { authStore } from "../authStore";

export async function loginConversation(
  conversation: MyConversation,
  ctx: MyContext
): Promise<void> {
  const lang = ctx.session.lang;

  if (ctx.session.credentialId) {
    await ctx.reply(t(lang, "already_logged_in", { login: ctx.session.login! }));
    return;
  }

  const cancelKb = new Keyboard().text(t(lang, "btn_menu_cancel")).resized();

  await ctx.reply(t(lang, "login_prompt_login"), { reply_markup: cancelKb });
  const loginCtx = await conversation.waitFor("message:text");
  const login = loginCtx.message.text.trim();

  await ctx.reply(t(lang, "login_prompt_password"), { reply_markup: cancelKb });
  const passwordCtx = await conversation.waitFor("message:text");
  const password = passwordCtx.message.text.trim();

  const result = await conversation.external(() => {
    const cred = findCredentialByLogin(login);
    if (!cred) return { error: "invalid" as const };
    if (!verifyPassword(password, cred.password)) return { error: "invalid" as const };
    if (!cred.is_active) return { error: "inactive" as const };
    const branchId =
      cred.type === "branch" ? getBranchByCredentialId(cred.id)?.id : undefined;
    return { credentialId: cred.id, login: cred.login, type: cred.type, branchId };
  });

  if ("error" in result) {
    await ctx.reply(t(lang, result.error === "inactive" ? "account_inactive" : "login_failed"));
    return;
  }

  // Persist auth in the global store — survives grammY session quirks
  const chatId = ctx.chat!.id;
  authStore.set(chatId, {
    credentialId: result.credentialId,
    login: result.login,
    type: result.type,
    branchId: result.branchId,
  });

  // Also set on ctx.session so current handler sees it immediately
  ctx.session.credentialId = result.credentialId;
  ctx.session.login = result.login;
  ctx.session.type = result.type;
  ctx.session.branchId = result.branchId;

  await ctx.reply(t(lang, "login_success", { login: result.login, type: result.type }), {
    reply_markup: buildMenuKeyboard(result.type, lang),
  });
}
