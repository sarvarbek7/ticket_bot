import { InlineKeyboard } from "grammy";
import { MyContext, MyConversation } from "../types";
import { t } from "../locales";
import { getStatistics, getAllBranches } from "../db";
import { pickDate } from "../utils/calendar";

export async function statisticsConversation(
  conversation: MyConversation,
  ctx: MyContext
): Promise<void> {
  const lang = ctx.session.lang;

  const startDate = await pickDate(conversation, ctx, t(lang, "stats_select_start"), "stats_start");
  const endDate   = await pickDate(conversation, ctx, t(lang, "stats_select_end"),   "stats_end");

  const branches = await conversation.external(() => getAllBranches());

  const kb = new InlineKeyboard();
  for (const b of branches) {
    kb.text(b.name, `stats:${b.id}`).row();
  }
  kb.text(t(lang, "stats_btn_all"), "stats:all");

  await ctx.reply(t(lang, "stats_select_branch"), { reply_markup: kb });

  const selCtx = await conversation.waitFor("callback_query:data");
  await selCtx.answerCallbackQuery();
  const data = selCtx.callbackQuery.data.split(":")[1];

  const branchId = data === "all" ? null : parseInt(data, 10);
  const stats = await conversation.external(() => getStatistics(branchId, startDate, endDate));

  if (stats.total === 0) {
    await ctx.reply(t(lang, "stats_empty"));
    return;
  }

  const inProgress = stats.byStatus.find((r) => r.status === "in_progress")?.count ?? 0;
  const sale       = stats.byStatus.find((r) => r.status === "sale")?.count ?? 0;
  const cancelled  = stats.byStatus.find((r) => r.status === "cancelled")?.count ?? 0;

  const lines: string[] = [
    t(lang, "stats_overall_header"),
    `📅 ${startDate} → ${endDate}`,
    t(lang, "stats_result_label"),
    t(lang, "stats_total", { total: stats.total }),
    "",
    t(lang, "stats_in_progress_row", { count: inProgress }),
    t(lang, "stats_sale_row",        { count: sale }),
    t(lang, "stats_cancelled_row",   { count: cancelled }),
    "",
    "─".repeat(40),
    t(lang, "stats_managers_header"),
  ];

  for (const mgr of stats.byManager) {
    lines.push(
      "",
      t(lang, "stats_manager_row", { branch: mgr.branch_name, manager: mgr.manager_name }),
      t(lang, "stats_manager_sale",        { count: mgr.sale }),
      t(lang, "stats_manager_in_progress", { count: mgr.in_progress }),
      t(lang, "stats_manager_cancelled",   { count: mgr.cancelled })
    );
  }

  await ctx.reply(lines.join("\n"));
}
