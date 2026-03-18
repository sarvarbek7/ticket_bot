import { InlineKeyboard } from "grammy";
import { MyContext, MyConversation, ClientStatus, Lang } from "../types";
import { t } from "../locales";
import {
  createClient,
  getAllClients,
  getClientsByBranch,
  getClientById,
  updateClientStatus,
  getManagersByBranch,
  getAllBranches,
} from "../db";

function statusLabel(lang: Lang, status: string): string {
  const key = `status_${status}` as Parameters<typeof t>[1];
  return t(lang, key) || status;
}

function statusKeyboard(clientId: number, lang: Lang): InlineKeyboard {
  return new InlineKeyboard()
    .text(t(lang, "btn_sale"), `status:${clientId}:sale`)
    .text(t(lang, "btn_cancelled"), `status:${clientId}:cancelled`);
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

  await ctx.reply(t(lang, "add_client_phone"));
  const phoneCtx = await conversation.waitFor("message:text");
  const phone = phoneCtx.message.text.trim();

  await ctx.reply(t(lang, "add_client_direction"));
  const dirCtx = await conversation.waitFor("message:text");
  const direction = dirCtx.message.text.trim().toUpperCase();

  await ctx.reply(t(lang, "add_client_name"));
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

  await ctx.reply(t(lang, "add_client_select_status"), { reply_markup: statusKb });

  const statusCtx = await conversation.waitFor("callback_query:data");
  await statusCtx.answerCallbackQuery();
  const status = statusCtx.callbackQuery.data.split(":")[1] as ClientStatus;

  const id = createClient(name, phone, direction, branchId, managerId, status);

  await ctx.reply(
    t(lang, "add_client_success", {
      id,
      name,
      phone,
      direction,
      manager: manager?.name ?? "—",
      status: statusLabel(lang, status),
    }),
    status === "in_progress" ? { reply_markup: statusKeyboard(id, lang) } : {}
  );
}

// ── /list_clients ─────────────────────────────────────────────────────────────

const LIST_PAGE_SIZE = 10;

export async function listClientsConversation(
  conversation: MyConversation,
  ctx: MyContext
): Promise<void> {
  const lang = ctx.session.lang;
  const type = ctx.session.type!;
  const chatId = ctx.chat!.id;

  let clients: ReturnType<typeof getAllClients>;

  if (type === "branch") {
    clients = await conversation.external(() => getClientsByBranch(ctx.session.branchId!));
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
    const rows = slice.map((c) =>
      t(lang, "client_row", {
        id: c.id,
        name: c.name,
        phone: c.phone,
        direction: c.direction_name,
        status: statusLabel(lang, c.buying_status),
        manager: c.manager_name ?? "—",
      })
    );
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
    kb.text(t(lang, "btn_cancel"), "lcl:cancel");
    return kb;
  }

  const listMsg = await ctx.reply(pageText(page), { reply_markup: pageKb(page) });
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
        .editMessageText(chatId, listMsgId, pageText(page), { reply_markup: pageKb(page) })
        .catch(() => {});
      continue;
    }
  }
}

// ── /get_client_info ──────────────────────────────────────────────────────────

export async function getClientInfoConversation(
  conversation: MyConversation,
  ctx: MyContext
): Promise<void> {
  const lang = ctx.session.lang;

  await ctx.reply(t(lang, "get_client_info_prompt"));
  const idCtx = await conversation.waitFor("message:text");
  const id = parseInt(idCtx.message.text.trim(), 10);

  if (isNaN(id)) {
    await ctx.reply(t(lang, "invalid_input"));
    return;
  }

  const client = getClientById(id);
  if (!client) {
    await ctx.reply(t(lang, "client_not_found", { id }));
    return;
  }

  await ctx.reply(
    t(lang, "client_info", {
      id: client.id,
      name: client.name,
      phone: client.phone,
      direction: client.direction_name,
      status: statusLabel(lang, client.buying_status),
      branch: client.branch_name ?? "—",
      manager: client.manager_name ?? "—",
    }),
    client.buying_status === "in_progress"
      ? { reply_markup: statusKeyboard(client.id, lang) }
      : {}
  );
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
  kb.text(t(lang, "btn_cancel"), "csc:cancel");
  return kb;
}

export async function changeClientStatusConversation(
  conversation: MyConversation,
  ctx: MyContext
): Promise<void> {
  const lang = ctx.session.lang;
  const branchId = ctx.session.branchId!;
  const chatId = ctx.chat!.id;

  let clients = await conversation.external(() => getClientsByBranch(branchId));

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
        clients = await conversation.external(() => getClientsByBranch(branchId));
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
