import { InlineKeyboard, Keyboard } from "grammy";
import { MyContext, MyConversation, ClientStatus, Lang } from "../types";
import { t } from "../locales";
import { buildMenuKeyboard } from "../utils/keyboard";
import {
  createClient,
  getAllClients,
  getClientsByBranch,
  getClientById,
  updateClientStatus,
  getManagersByBranch,
  getAllBranches,
  getInProgressClientsByBranch,
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

export async function listClientsConversation(
  conversation: MyConversation,
  ctx: MyContext
): Promise<void> {
  const lang = ctx.session.lang;
  const type = ctx.session.type!;

  let clients;

  if (type === "branch") {
    clients = getClientsByBranch(ctx.session.branchId!);
  } else {
    // admin: select branch or all
    const branches = getAllBranches();

    const kb = new InlineKeyboard();
    for (const b of branches) {
      kb.text(b.name, `listcl:${b.id}`).row();
    }
    kb.text(t(lang, "list_clients_btn_all"), "listcl:all");

    await ctx.reply(t(lang, "list_clients_select_branch"), { reply_markup: kb });

    const selCtx = await conversation.waitFor("callback_query:data");
    await selCtx.answerCallbackQuery();
    const data = selCtx.callbackQuery.data.split(":")[1];

    if (data === "all") {
      clients = getAllClients();
    } else {
      clients = getClientsByBranch(parseInt(data, 10));
    }
  }

  if (clients.length === 0) {
    await ctx.reply(t(lang, "list_clients_empty"));
    return;
  }

  const rows = clients.map((c) =>
    t(lang, "client_row", {
      id: c.id,
      name: c.name,
      phone: c.phone,
      direction: c.direction_name,
      status: statusLabel(lang, c.buying_status),
      manager: c.manager_name ?? "—",
    })
  );

  const CHUNK = 30;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const header = i === 0 ? t(lang, "list_clients_header") : "";
    await ctx.reply(header + rows.slice(i, i + CHUNK).join("\n"));
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

export async function changeClientStatusConversation(
  conversation: MyConversation,
  ctx: MyContext
): Promise<void> {
  const lang = ctx.session.lang;
  const branchId = ctx.session.branchId!;
  const menuKb = buildMenuKeyboard(ctx.session.type!, lang);

  while (true) {
    const inProgressClients = await conversation.external(() =>
      getInProgressClientsByBranch(branchId)
    );

    if (inProgressClients.length === 0) {
      await ctx.reply(t(lang, "change_client_status_no_clients"), { reply_markup: menuKb });
      return;
    }

    // Show in_progress clients as one-time reply keyboard
    const replyKb = new Keyboard();
    for (const c of inProgressClients) {
      replyKb.text(`#${c.id} | ${c.name} | ${c.direction_name}`).row();
    }
    replyKb.oneTime().resized();

    await ctx.reply(t(lang, "change_client_status_select"), { reply_markup: replyKb });

    const selCtx = await conversation.waitFor("message:text");
    const match = selCtx.message.text.match(/^#(\d+)/);
    const id = match ? parseInt(match[1], 10) : NaN;

    if (isNaN(id)) {
      await ctx.reply(t(lang, "invalid_input"), { reply_markup: menuKb });
      return;
    }

    const client = await conversation.external(() => getClientById(id));
    if (!client || client.buying_status !== "in_progress") {
      await ctx.reply(t(lang, "change_client_status_not_in_progress"), { reply_markup: menuKb });
      return;
    }

    const inlineKb = new InlineKeyboard()
      .text(t(lang, "btn_sale"), `changestatus:${id}:sale`)
      .text(t(lang, "btn_cancelled"), `changestatus:${id}:cancelled`);

    await ctx.reply(
      t(lang, "change_client_status_current", { id: client.id, status: statusLabel(lang, client.buying_status) }),
      { reply_markup: inlineKb }
    );

    const cbCtx = await conversation.waitFor("callback_query:data");
    const [, , newStatus] = cbCtx.callbackQuery.data.split(":");

    if (newStatus !== "sale" && newStatus !== "cancelled") {
      await cbCtx.answerCallbackQuery(t(lang, "change_client_status_invalid"));
      return;
    }

    await conversation.external(() => updateClientStatus(id, newStatus as ClientStatus));

    await cbCtx.answerCallbackQuery({
      text: t(lang, "change_client_status_success", { id, status: statusLabel(lang, newStatus) }),
      show_alert: true,
    });

    // Edit inline message: update status text, remove keyboard
    const statusIcon: Record<string, string> = { sale: "🟢", cancelled: "🔴" };
    const originalText = cbCtx.callbackQuery.message?.text ?? "";
    const updatedText = originalText
      .replace(client.buying_status, newStatus)
      .replace(/\n\n[\s\S]*$/, "");
    await cbCtx.editMessageText(updatedText).catch(() => {});

    // Loop: show the updated client list again
  }
}
