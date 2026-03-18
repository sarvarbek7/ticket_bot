import { MyContext } from "../types";
import { t } from "../locales";
import { buildMenuKeyboard, buildGuestKeyboard } from "../utils/keyboard";

export async function handleStart(ctx: MyContext): Promise<void> {
  const lang = ctx.session.lang;
  const welcome = t(lang, "welcome");

  if (!ctx.session.credentialId) {
    await ctx.reply(welcome, { reply_markup: buildGuestKeyboard(lang) });
  } else {
    await ctx.reply(welcome, { reply_markup: buildMenuKeyboard(ctx.session.type!, lang) });
  }
}
