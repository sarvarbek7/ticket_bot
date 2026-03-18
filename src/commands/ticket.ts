import { InlineKeyboard, Keyboard } from "grammy";
import { MyContext, MyConversation, ClientStatus, Lang } from "../types";
import { t } from "../locales";
import {
  createClient,
  getAllClients,
  getClientsByBranch,
  getClientsByBranchManagerStatus,
  updateClientStatus,
  getManagersByBranch,
  getAllBranches,
} from "../db";

function statusLabel(lang: Lang, status: string): string {
  const key = `status_${status}` as Parameters<typeof t>[1];
  return t(lang, key) || status;
}


// ── /add_client ──────────────────────────────────────────────────────────────

export async function addClientConversation(
  conversation: MyConversation,
  ctx: MyContext
): Promise<void> {
  const lang = ctx.session.lang;
  const branchId = ctx.session.branchId!;

  const managers = getManagersByBranch(branchId);
  if (managers.length === 0) {
    await ctx.reply(t(lang, "add_client_no_managers"));
    return;
  }

  const cancelKb = new Keyboard().text(t(lang, "btn_menu_cancel")).resized();

  await ctx.reply(t(lang, "add_client_phone"), { reply_markup: cancelKb });
  const phoneCtx = await conversation.waitFor("message:text");
  const phone = phoneCtx.message.text.trim();

  await ctx.reply(t(lang, "add_client_direction"), { reply_markup: cancelKb });
  const dirCtx = await conversation.waitFor("message:text");
  const direction = dirCtx.message.text.trim().toUpperCase();

  await ctx.reply(t(lang, "add_client_name"), { reply_markup: cancelKb });
  const nameCtx = await conversation.waitFor("message:text");
  const name = nameCtx.message.text.trim();

  const kb = new InlineKeyboard();
  for (const m of managers) {
    kb.text(m.name, `selmanager:${m.id}`).row();
  }

  await ctx.reply(t(lang, "add_client_select_manager"), { reply_markup: kb });

  const selCtx = await conversation.waitFor("callback_query:data");
  await selCtx.answerCallbackQuery();
  const managerId = parseInt(selCtx.callbackQuery.data.split(":")[1], 10);
  const manager = managers.find((m) => m.id === managerId);

  const statusKb = new InlineKeyboard()
    .text(t(lang, "btn_in_progress"), "newstatus:in_progress")
    .text(t(lang, "btn_sale"), "newstatus:sale")
    .text(t(lang, "btn_cancelled"), "newstatus:cancelled");

  const statusMsg = await ctx.reply(t(lang, "add_client_select_status"), { reply_markup: statusKb });

  const statusCtx = await conversation.waitFor("callback_query:data");
  const status = statusCtx.callbackQuery.data.split(":")[1] as ClientStatus;

  createClient(name, phone, direction, branchId, managerId, status);

  await statusCtx.answerCallbackQuery({
    text: t(lang, "add_client_alert_success"),
    show_alert: true,
  });

  await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id).catch(() => {});
}

// ── /list_clients ─────────────────────────────────────────────────────────────

const LIST_PAGE_SIZE = 10;

const STATUS_ICON: Record<string, string> = {
  in_progress: "🟡",
  sale: "🟢",
  cancelled: "🔴",
};

export async function listClientsConversation(
  conversation: MyConversation,
  ctx: MyContext
): Promise<void> {
  const lang = ctx.session.lang;
  const type = ctx.session.type!;
  const chatId = ctx.chat!.id;

  let clients: ReturnType<typeof getAllClients>;

  if (type === "branch") {
    const branchId = ctx.session.branchId!;

    // Step 1: choose manager
    const managers = await conversation.external(() => getManagersByBranch(branchId));
    const managerKb = new InlineKeyboard();
    for (const m of managers) managerKb.text(m.name, `listcl:m:${m.id}`).row();
    managerKb.text(t(lang, "list_clients_btn_all_managers"), "listcl:m:all");
    await ctx.reply(t(lang, "list_clients_select_manager"), { reply_markup: managerKb });

    const managerCb = await conversation.waitFor("callback_query:data");
    await managerCb.answerCallbackQuery();
    const managerSel = managerCb.callbackQuery.data.split(":")[2];
    const managerId = managerSel === "all" ? null : parseInt(managerSel, 10);

    // Step 2: choose status
    const statusKb = new InlineKeyboard()
      .text(t(lang, "status_in_progress"), "listcl:s:in_progress")
      .text(t(lang, "status_sale"), "listcl:s:sale").row()
      .text(t(lang, "status_cancelled"), "listcl:s:cancelled").row()
      .text(t(lang, "list_clients_btn_all_statuses"), "listcl:s:all");
    await ctx.reply(t(lang, "list_clients_select_status"), { reply_markup: statusKb });

    const statusCb = await conversation.waitFor("callback_query:data");
    await statusCb.answerCallbackQuery();
    const statusSel = statusCb.callbackQuery.data.split(":")[2];
    const statusFilter = statusSel === "all" ? null : statusSel;

    clients = await conversation.external(() =>
      getClientsByBranchManagerStatus(branchId, managerId, statusFilter)
    );
  } else {
    const branches = await conversation.external(() => getAllBranches());
    const kb = new InlineKeyboard();
    for (const b of branches) kb.text(b.name, `listcl:${b.id}`).row();
    kb.text(t(lang, "list_clients_btn_all"), "listcl:all");

    await ctx.reply(t(lang, "list_clients_select_branch"), { reply_markup: kb });

    const selCtx = await conversation.waitFor("callback_query:data");
    await selCtx.answerCallbackQuery();
    const sel = selCtx.callbackQuery.data.split(":")[1];

    clients = await conversation.external(() =>
      sel === "all" ? getAllClients() : getClientsByBranch(parseInt(sel, 10))
    );
  }

  if (clients.length === 0) {
    await ctx.reply(t(lang, "list_clients_empty"));
    return;
  }

  const totalPages = Math.ceil(clients.length / LIST_PAGE_SIZE);
  let page = 1;

  function pageText(p: number): string {
    const slice = clients.slice((p - 1) * LIST_PAGE_SIZE, p * LIST_PAGE_SIZE);
    const rows = slice.map((c) => {
      const icon = STATUS_ICON[c.buying_status] ?? "⚪";
      return `${icon} ${c.phone} <b>${c.direction_name}</b> ${c.name}`;
    });
    const header = t(lang, "list_clients_header");
    const pageInfo = totalPages > 1 ? `(${p}/${totalPages})\n` : "";
    return header + pageInfo + rows.join("\n");
  }

  function pageKb(p: number): InlineKeyboard {
    const kb = new InlineKeyboard();
    if (totalPages > 1) {
      for (const pg of paginationPages(p, totalPages)) {
        if (pg === "...") {
          kb.text("…", "lcl:noop");
        } else {
          kb.text(pg === p ? `<${pg}>` : String(pg), pg === p ? "lcl:noop" : `lcl:p:${pg}`);
        }
      }
      kb.row();
    }
    kb.text(t(lang, "btn_back"), "lcl:cancel");
    return kb;
  }

  const listMsg = await ctx.reply(pageText(page), {
    reply_markup: pageKb(page),
    parse_mode: "HTML",
  });
  const listMsgId = listMsg.message_id;

  while (true) {
    const cbCtx = await conversation.waitFor("callback_query:data");
    const data = cbCtx.callbackQuery.data;

    if (data === "lcl:noop") {
      await cbCtx.answerCallbackQuery();
      continue;
    }

    if (data === "lcl:cancel") {
      await cbCtx.answerCallbackQuery();
      await ctx.api.editMessageReplyMarkup(chatId, listMsgId).catch(() => {});
      return;
    }

    if (data.startsWith("lcl:p:")) {
      await cbCtx.answerCallbackQuery();
      page = parseInt(data.split(":")[2]);
      await ctx.api
        .editMessageText(chatId, listMsgId, pageText(page), {
          reply_markup: pageKb(page),
          parse_mode: "HTML",
        })
        .catch(() => {});
      continue;
    }
  }
}


// ── /change_client_status ─────────────────────────────────────────────────────

const CSC_PAGE_SIZE = 10;

function paginationPages(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, 2, total - 1, total]);
  if (current > 1) pages.add(current - 1);
  pages.add(current);
  if (current < total) pages.add(current + 1);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result: (number | "...")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("...");
    result.push(sorted[i]);
  }
  return result;
}

function cscListKeyboard(
  clients: ReturnType<typeof getClientsByBranch>,
  page: number,
  totalPages: number,
  lang: Lang
): InlineKeyboard {
  const kb = new InlineKeyboard();
  const slice = clients.slice((page - 1) * CSC_PAGE_SIZE, page * CSC_PAGE_SIZE);
  for (const c of slice) {
    kb.text(`#${c.id} | ${statusLabel(lang, c.buying_status)} | ${c.name}`, `csc:c:${c.id}`).row();
  }
  if (totalPages > 1) {
    for (const p of paginationPages(page, totalPages)) {
      if (p === "...") {
        kb.text("…", "csc:noop");
      } else {
        kb.text(p === page ? `<${p}>` : String(p), p === page ? "csc:noop" : `csc:p:${p}`);
      }
    }
    kb.row();
  }
  kb.text(t(lang, "btn_back"), "csc:cancel");
  return kb;
}

export async function changeClientStatusConversation(
  conversation: MyConversation,
  ctx: MyContext
): Promise<void> {
  const lang = ctx.session.lang;
  const branchId = ctx.session.branchId!;
  const chatId = ctx.chat!.id;

  // Step 1: choose manager
  const managers = await conversation.external(() => getManagersByBranch(branchId));
  const managerKb = new InlineKeyboard();
  for (const m of managers) managerKb.text(m.name, `csc:m:${m.id}`).row();
  managerKb.text(t(lang, "list_clients_btn_all_managers"), "csc:m:all");
  await ctx.reply(t(lang, "list_clients_select_manager"), { reply_markup: managerKb });

  const managerCb = await conversation.waitFor("callback_query:data");
  await managerCb.answerCallbackQuery();
  const managerSel = managerCb.callbackQuery.data.split(":")[2];
  const managerId = managerSel === "all" ? null : parseInt(managerSel, 10);

  // Step 2: choose status filter
  const statusFilterKb = new InlineKeyboard()
    .text(t(lang, "status_in_progress"), "csc:f:in_progress")
    .text(t(lang, "status_sale"), "csc:f:sale").row()
    .text(t(lang, "status_cancelled"), "csc:f:cancelled").row()
    .text(t(lang, "list_clients_btn_all_statuses"), "csc:f:all");
  await ctx.reply(t(lang, "list_clients_select_status"), { reply_markup: statusFilterKb });

  const statusFilterCb = await conversation.waitFor("callback_query:data");
  await statusFilterCb.answerCallbackQuery();
  const statusFilterSel = statusFilterCb.callbackQuery.data.split(":")[2];
  const statusFilter = statusFilterSel === "all" ? null : statusFilterSel;

  let clients = await conversation.external(() =>
    getClientsByBranchManagerStatus(branchId, managerId, statusFilter)
  );

  if (clients.length === 0) {
    await ctx.reply(t(lang, "change_client_status_no_clients"));
    return;
  }

  let page = 1;
  let totalPages = Math.ceil(clients.length / CSC_PAGE_SIZE);

  const listMsg = await ctx.reply(t(lang, "change_client_status_select"), {
    reply_markup: cscListKeyboard(clients, page, totalPages, lang),
  });
  const listMsgId = listMsg.message_id;

  while (true) {
    const cbCtx = await conversation.waitFor("callback_query:data");
    const data = cbCtx.callbackQuery.data;

    if (data === "csc:noop") {
      await cbCtx.answerCallbackQuery();
      continue;
    }

    if (data === "csc:cancel") {
      await cbCtx.answerCallbackQuery();
      await ctx.api.editMessageReplyMarkup(chatId, listMsgId).catch(() => {});
      return;
    }

    if (data.startsWith("csc:p:")) {
      await cbCtx.answerCallbackQuery();
      page = parseInt(data.split(":")[2]);
      await ctx.api
        .editMessageReplyMarkup(chatId, listMsgId, {
          reply_markup: cscListKeyboard(clients, page, totalPages, lang),
        })
        .catch(() => {});
      continue;
    }

    if (data.startsWith("csc:c:")) {
      await cbCtx.answerCallbackQuery();
      const clientId = parseInt(data.split(":")[2]);
      const client = clients.find((c) => c.id === clientId);
      if (!client) continue;

      const allStatuses: ClientStatus[] = ["in_progress", "sale", "cancelled"];
      const statusKb = new InlineKeyboard();
      for (const s of allStatuses) {
        if (s !== client.buying_status) statusKb.text(statusLabel(lang, s), `csc:s:${clientId}:${s}`);
      }
      statusKb.row().text(t(lang, "btn_back"), "csc:back");

      const statusMsg = await ctx.reply(
        t(lang, "change_client_status_current", {
          id: client.id,
          status: statusLabel(lang, client.buying_status),
        }),
        { reply_markup: statusKb }
      );
      const statusMsgId = statusMsg.message_id;

      const statusCb = await conversation.waitFor("callback_query:data");
      const statusData = statusCb.callbackQuery.data;

      if (statusData === "csc:back") {
        await statusCb.answerCallbackQuery();
        await ctx.api.deleteMessage(chatId, statusMsgId).catch(() => {});
        continue;
      }

      if (statusData.startsWith("csc:s:")) {
        const newStatus = statusData.split(":")[3] as ClientStatus;
        await conversation.external(() => updateClientStatus(clientId, newStatus));

        await statusCb.answerCallbackQuery({
          text: t(lang, "change_client_status_success", {
            id: clientId,
            status: statusLabel(lang, newStatus),
          }),
          show_alert: true,
        });

        await ctx.api.deleteMessage(chatId, statusMsgId).catch(() => {});

        // Re-fetch to reflect the update in the list
        clients = await conversation.external(() =>
          getClientsByBranchManagerStatus(branchId, managerId, statusFilter)
        );
        totalPages = Math.ceil(clients.length / CSC_PAGE_SIZE);
        if (page > totalPages) page = totalPages;

        await ctx.api
          .editMessageReplyMarkup(chatId, listMsgId, {
            reply_markup: cscListKeyboard(clients, page, totalPages, lang),
          })
          .catch(() => {});
        continue;
      }

      await statusCb.answerCallbackQuery();
      await ctx.api.deleteMessage(chatId, statusMsgId).catch(() => {});
    }
  }
}
