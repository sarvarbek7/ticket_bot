import { InlineKeyboard } from "grammy";
import { MyContext } from "../types";
import { t } from "../locales";
import { buildMenuKeyboard, buildGuestKeyboard } from "../utils/keyboard";

export async function handleStart(ctx: MyContext): Promise<void> {
  const keyboard = new InlineKeyboard()
    .text("🇬🇧 English", "lang:en")
    .text("🇷🇺 Русский", "lang:ru")
    .text("🇺🇿 O'zbek", "lang:uz");

  await ctx.reply(t(ctx.session.lang, "choose_language"), { reply_markup: keyboard });
}

export async function handleLangCallback(ctx: MyContext): Promise<void> {
  const data = ctx.callbackQuery?.data ?? "";
  const lang = data.split(":")[1] as "en" | "ru" | "uz";

  ctx.session.lang = lang;
  await ctx.answerCallbackQuery();

  const welcome = t(lang, "welcome");

  await ctx.editMessageText(welcome);

  if (!ctx.session.credentialId) {
    await ctx.reply(welcome, { reply_markup: buildGuestKeyboard(lang) });
  } else {
    const type = ctx.session.type!;
    await ctx.reply(welcome, { reply_markup: buildMenuKeyboard(type, lang) });
  }
}
