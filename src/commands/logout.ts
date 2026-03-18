import { MyContext } from "../types";
import { t } from "../locales";
import { buildGuestKeyboard } from "../utils/keyboard";
import { authStore } from "../authStore";

export async function handleLogout(ctx: MyContext): Promise<void> {
  const lang = ctx.session.lang;

  if (!ctx.session.credentialId) {
    await ctx.reply(t(lang, "not_logged_in"));
    return;
  }

  authStore.clear(ctx.chat!.id);

  ctx.session.credentialId = undefined;
  ctx.session.login = undefined;
  ctx.session.type = undefined;
  ctx.session.branchId = undefined;

  await ctx.reply(t(lang, "logout_success"), {
    reply_markup: buildGuestKeyboard(lang),
  });
}
