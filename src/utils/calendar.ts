import { InlineKeyboard } from "grammy";
import { MyContext, MyConversation } from "../types";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_HEADERS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export function buildCalendarKeyboard(year: number, month: number, prefix: string): InlineKeyboard {
  const kb = new InlineKeyboard();

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  // Header row
  kb.text("◀", `${prefix}:prev:${prevYear}:${prevMonth}`)
    .text(`${MONTH_NAMES[month - 1]} ${year}`, `${prefix}:ignore`)
    .text("▶", `${prefix}:next:${nextYear}:${nextMonth}`)
    .row();

  // Day name headers
  for (const d of DAY_HEADERS) kb.text(d, `${prefix}:ignore`);
  kb.row();

  // Days grid
  const firstDaySun = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const firstDayMon = (firstDaySun + 6) % 7; // shift so Mon=0
  const daysInMonth = new Date(year, month, 0).getDate();

  let col = 0;
  for (let i = 0; i < firstDayMon; i++) {
    kb.text(" ", `${prefix}:ignore`);
    col++;
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const mm = String(month).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    kb.text(String(day), `${prefix}:date:${year}-${mm}-${dd}`);
    col++;
    if (col % 7 === 0) kb.row();
  }
  if (col % 7 !== 0) kb.row();

  return kb;
}

/**
 * Interactive date picker for use inside a grammY conversation.
 * Returns a date string in YYYY-MM-DD format.
 */
export async function pickDate(
  conversation: MyConversation,
  ctx: MyContext,
  promptText: string,
  prefix: string
): Promise<string> {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1;

  const msg = await ctx.reply(promptText, {
    reply_markup: buildCalendarKeyboard(year, month, prefix),
  });

  while (true) {
    const cb = await conversation.waitFor("callback_query:data");
    const data = cb.callbackQuery.data;

    if (data === `${prefix}:ignore`) {
      await cb.answerCallbackQuery();
      continue;
    }

    if (data.startsWith(`${prefix}:date:`)) {
      const date = data.slice(`${prefix}:date:`.length);
      await cb.answerCallbackQuery(date);
      await ctx.api.editMessageReplyMarkup(
        msg.chat.id,
        msg.message_id,
        { reply_markup: undefined }
      ).catch(() => {/* ignore if already removed */});
      return date;
    }

    if (data.startsWith(`${prefix}:prev:`) || data.startsWith(`${prefix}:next:`)) {
      const parts = data.split(":");
      year = parseInt(parts[2]);
      month = parseInt(parts[3]);
      await cb.editMessageReplyMarkup({
        reply_markup: buildCalendarKeyboard(year, month, prefix),
      });
      await cb.answerCallbackQuery();
      continue;
    }

    await cb.answerCallbackQuery();
  }
}
