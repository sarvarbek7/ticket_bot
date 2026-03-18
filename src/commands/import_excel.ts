import { InputFile } from "grammy";
import ExcelJS from "exceljs";
import { InlineKeyboard } from "grammy";
import { MyContext, MyConversation } from "../types";
import { t } from "../locales";
import { getClientsForExport, getAllBranches, getManagersByBranch } from "../db";
import { pickDate } from "../utils/calendar";

export async function importConversation(
  conversation: MyConversation,
  ctx: MyContext
): Promise<void> {
  const lang = ctx.session.lang;

  const startDate = await pickDate(conversation, ctx, t(lang, "import_select_start"), "import_start");
  const endDate   = await pickDate(conversation, ctx, t(lang, "import_select_end"),   "import_end");

  const branches = await conversation.external(() => getAllBranches());

  const kb = new InlineKeyboard();
  for (const b of branches) {
    kb.text(b.name, `import:${b.id}`).row();
  }
  kb.text(t(lang, "import_btn_all"), "import:all");

  await ctx.reply(t(lang, "import_select_branch"), { reply_markup: kb });

  const selCtx = await conversation.waitFor("callback_query:data");
  await selCtx.answerCallbackQuery();
  const data = selCtx.callbackQuery.data.split(":")[1];

  const branchId = data === "all" ? null : parseInt(data, 10);
  const clients = await conversation.external(() =>
    getClientsForExport(branchId, startDate, endDate)
  );

  if (clients.length === 0) {
    await ctx.reply(t(lang, "import_empty"));
    return;
  }

  await ctx.reply(t(lang, "import_sending"));

  const branchLabel = branchId !== null ? `branch_${branchId}` : "all";
  const filename = `clients_${branchLabel}_${startDate}_${endDate}.xlsx`;
  await buildAndSendExcel(ctx, clients, filename);
}

async function buildAndSendExcel(
  ctx: MyContext,
  clients: ReturnType<typeof getClientsForExport>,
  filename: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Clients");

  sheet.columns = [
    { header: "ID",         key: "id",             width: 8  },
    { header: "Name",       key: "name",            width: 20 },
    { header: "Phone",      key: "phone",           width: 18 },
    { header: "Direction",  key: "direction_name",  width: 22 },
    { header: "Status",     key: "buying_status",   width: 14 },
    { header: "Branch",     key: "branch_name",     width: 20 },
    { header: "Manager",    key: "manager_name",    width: 20 },
    { header: "Created At", key: "created_at",      width: 20 },
  ];

  sheet.getRow(1).font = { bold: true };

  for (const c of clients) {
    sheet.addRow({
      id:             c.id,
      name:           c.name,
      phone:          c.phone,
      direction_name: c.direction_name,
      buying_status:  c.buying_status,
      branch_name:    c.branch_name ?? "",
      manager_name:   c.manager_name ?? "",
      created_at:     c.created_at ?? "",
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  await ctx.replyWithDocument(new InputFile(Buffer.from(buffer), filename));
}

export async function branchImportConversation(
  conversation: MyConversation,
  ctx: MyContext
): Promise<void> {
  const lang = ctx.session.lang;
  const branchId = ctx.session.branchId!;

  // Step 1: select specific manager
  const managers = await conversation.external(() => getManagersByBranch(branchId));
  if (managers.length === 0) {
    await ctx.reply(t(lang, "add_client_no_managers"));
    return;
  }

  const mgrKb = new InlineKeyboard();
  for (const m of managers) mgrKb.text(m.name, `bimport:m:${m.id}`).row();

  await ctx.reply(t(lang, "import_select_manager"), { reply_markup: mgrKb });

  const mgrCtx = await conversation.waitFor("callback_query:data");
  await mgrCtx.answerCallbackQuery();
  const managerId = parseInt(mgrCtx.callbackQuery.data.split(":")[2], 10);

  // Step 2: all data or filter by date
  const modeKb = new InlineKeyboard()
    .text(t(lang, "import_btn_all_data"), "bimport:mode:all")
    .text(t(lang, "import_btn_by_date"), "bimport:mode:date");

  await ctx.reply(t(lang, "import_select_date_mode"), { reply_markup: modeKb });

  const modeCtx = await conversation.waitFor("callback_query:data");
  await modeCtx.answerCallbackQuery();
  const mode = modeCtx.callbackQuery.data.split(":")[2];

  let startDate: string | null = null;
  let endDate: string | null = null;

  if (mode === "date") {
    startDate = await pickDate(conversation, ctx, t(lang, "import_select_start"), "bimport_start");
    endDate   = await pickDate(conversation, ctx, t(lang, "import_select_end"),   "bimport_end");
  }

  const clients = await conversation.external(() =>
    getClientsForExport(branchId, startDate, endDate, managerId)
  );

  if (clients.length === 0) {
    await ctx.reply(t(lang, "import_empty"));
    return;
  }

  await ctx.reply(t(lang, "import_sending"));

  const dateLabel = startDate ? `${startDate}_${endDate}` : "all";
  const filename = `clients_branch_${branchId}_mgr_${managerId}_${dateLabel}.xlsx`;
  await buildAndSendExcel(ctx, clients, filename);
}
