import "dotenv/config";
import { Bot, session } from "grammy";
import { conversations, createConversation } from "@grammyjs/conversations";

import { MyContext, SessionData, ClientStatus } from "./types";
import { t } from "./locales";
import { getClientById, updateClientStatus } from "./db";
import { authStore } from "./authStore";

import { handleStart, handleLangCallback } from "./commands/start";
import { buildMenuKeyboard, buildGuestKeyboard, allVariants } from "./utils/keyboard";
import { loginConversation } from "./commands/login";
import { handleLogout } from "./commands/logout";
import {
  addAdminConversation,
  updateAdminConversation,
  deleteAdminConversation,
  handleListAdmins,
} from "./commands/admin";
import {
  addBranchConversation,
  updateBranchConversation,
  deleteBranchConversation,
  handleListBranches,
} from "./commands/branch";
import {
  addManagerConversation,
  updateManagerConversation,
  deleteManagerConversation,
  handleListManagers,
} from "./commands/manager";
import {
  addClientConversation,
  listClientsConversation,
  getClientInfoConversation,
  changeClientStatusConversation,
} from "./commands/ticket";
import { statisticsConversation } from "./commands/statistics";
import { importConversation } from "./commands/import_excel";

const token = process.env.BOT_TOKEN;
if (!token) throw new Error("BOT_TOKEN is not set in environment variables");

const bot = new Bot<MyContext>(token);

// ── Middleware ────────────────────────────────────────────────────────────────

bot.use(
  session<SessionData, MyContext>({
    initial: (): SessionData => ({ lang: "en" }),
  })
);

// Restore auth from the global store on every update (fixes grammY session+conversation quirks)
bot.use(async (ctx, next) => {
  const chatId = ctx.chat?.id ?? ctx.from?.id;
  if (chatId) {
    const auth = authStore.get(chatId);
    if (auth) {
      ctx.session.credentialId = auth.credentialId;
      ctx.session.login = auth.login;
      ctx.session.type = auth.type;
      ctx.session.branchId = auth.branchId;
    }
  }
  await next();
});

bot.use(conversations());

// Register all conversations
bot.use(createConversation(loginConversation));
bot.use(createConversation(addAdminConversation));
bot.use(createConversation(updateAdminConversation));
bot.use(createConversation(deleteAdminConversation));
bot.use(createConversation(addBranchConversation));
bot.use(createConversation(updateBranchConversation));
bot.use(createConversation(deleteBranchConversation));
bot.use(createConversation(addManagerConversation));
bot.use(createConversation(updateManagerConversation));
bot.use(createConversation(deleteManagerConversation));
bot.use(createConversation(addClientConversation));
bot.use(createConversation(listClientsConversation));
bot.use(createConversation(getClientInfoConversation));
bot.use(createConversation(changeClientStatusConversation));
bot.use(createConversation(statisticsConversation));
bot.use(createConversation(importConversation));

// ── Helpers ───────────────────────────────────────────────────────────────────

function requireAuth(ctx: MyContext): boolean {
  if (!ctx.session.credentialId) {
    ctx.reply(t(ctx.session.lang, "not_logged_in"), {
      reply_markup: buildGuestKeyboard(ctx.session.lang),
    });
    return false;
  }
  return true;
}

function requireAdmin(ctx: MyContext): boolean {
  if (!requireAuth(ctx)) return false;
  if (ctx.session.type !== "admin") {
    ctx.reply(t(ctx.session.lang, "unauthorized"));
    return false;
  }
  return true;
}

function requireBranch(ctx: MyContext): boolean {
  if (!requireAuth(ctx)) return false;
  if (ctx.session.type !== "branch") {
    ctx.reply(t(ctx.session.lang, "unauthorized"));
    return false;
  }
  return true;
}

// ── Commands ──────────────────────────────────────────────────────────────────

bot.command("start", handleStart);
bot.command("login", (ctx) => ctx.conversation.enter("loginConversation"));
bot.command("logout", handleLogout);
bot.command("change_language", handleStart);

bot.command("cancel", async (ctx) => {
  await ctx.conversation.exit();
  await ctx.reply(t(ctx.session.lang, "cancelled"));
});

// Admin management (admin only)
bot.command("add_admin", async (ctx) => {
  if (!requireAdmin(ctx)) return;
  await ctx.conversation.enter("addAdminConversation");
});

bot.command("update_admin", async (ctx) => {
  if (!requireAdmin(ctx)) return;
  await ctx.conversation.enter("updateAdminConversation");
});

bot.command("delete_admin", async (ctx) => {
  if (!requireAdmin(ctx)) return;
  await ctx.conversation.enter("deleteAdminConversation");
});

bot.command("list_admins", async (ctx) => {
  if (!requireAdmin(ctx)) return;
  await handleListAdmins(ctx);
});

// Branch management (admin only)
bot.command("add_branch", async (ctx) => {
  if (!requireAdmin(ctx)) return;
  await ctx.conversation.enter("addBranchConversation");
});

bot.command("update_branch", async (ctx) => {
  if (!requireAdmin(ctx)) return;
  await ctx.conversation.enter("updateBranchConversation");
});

bot.command("delete_branch", async (ctx) => {
  if (!requireAdmin(ctx)) return;
  await ctx.conversation.enter("deleteBranchConversation");
});

bot.command("list_branches", async (ctx) => {
  if (!requireAdmin(ctx)) return;
  await handleListBranches(ctx);
});

// Manager management (admin only)
bot.command("add_manager", async (ctx) => {
  if (!requireAdmin(ctx)) return;
  await ctx.conversation.enter("addManagerConversation");
});

bot.command("update_manager", async (ctx) => {
  if (!requireAdmin(ctx)) return;
  await ctx.conversation.enter("updateManagerConversation");
});

bot.command("delete_manager", async (ctx) => {
  if (!requireAdmin(ctx)) return;
  await ctx.conversation.enter("deleteManagerConversation");
});

bot.command("list_managers", async (ctx) => {
  if (!requireAdmin(ctx)) return;
  await handleListManagers(ctx);
});

// Client commands (branch only for add/change; admin+branch for list/info)
bot.command("add_client", async (ctx) => {
  if (!requireBranch(ctx)) return;
  await ctx.conversation.enter("addClientConversation");
});

bot.command("list_clients", async (ctx) => {
  if (!requireAuth(ctx)) return;
  await ctx.conversation.enter("listClientsConversation");
});

bot.command("get_client_info", async (ctx) => {
  if (!requireAuth(ctx)) return;
  await ctx.conversation.enter("getClientInfoConversation");
});

bot.command("change_client_status", async (ctx) => {
  if (!requireBranch(ctx)) return;
  await ctx.conversation.enter("changeClientStatusConversation");
});

// Statistics & import (admin only)
bot.command("statistics", async (ctx) => {
  if (!requireAdmin(ctx)) return;
  await ctx.conversation.enter("statisticsConversation");
});

bot.command("import", async (ctx) => {
  if (!requireAdmin(ctx)) return;
  await ctx.conversation.enter("importConversation");
});

// ── Menu button hears ─────────────────────────────────────────────────────────

bot.hears(allVariants("btn_menu_start"), handleStart);
bot.hears(allVariants("btn_menu_login"), (ctx) => ctx.conversation.enter("loginConversation"));
bot.hears(allVariants("btn_menu_change_language"), handleStart);

bot.hears(allVariants("btn_menu_cancel"), async (ctx) => {
  await ctx.conversation.exit();
  await ctx.reply(t(ctx.session.lang, "cancelled"));
});

bot.hears(allVariants("btn_menu_logout"), handleLogout);

// Admin management buttons
bot.hears(allVariants("btn_menu_add_admin"), async (ctx) => {
  if (!requireAdmin(ctx)) return;
  await ctx.conversation.enter("addAdminConversation");
});

bot.hears(allVariants("btn_menu_update_admin"), async (ctx) => {
  if (!requireAdmin(ctx)) return;
  await ctx.conversation.enter("updateAdminConversation");
});

bot.hears(allVariants("btn_menu_delete_admin"), async (ctx) => {
  if (!requireAdmin(ctx)) return;
  await ctx.conversation.enter("deleteAdminConversation");
});

bot.hears(allVariants("btn_menu_list_admins"), async (ctx) => {
  if (!requireAdmin(ctx)) return;
  await handleListAdmins(ctx);
});

// Branch buttons (admin)
bot.hears(allVariants("btn_menu_add_branch"), async (ctx) => {
  if (!requireAdmin(ctx)) return;
  await ctx.conversation.enter("addBranchConversation");
});

bot.hears(allVariants("btn_menu_update_branch"), async (ctx) => {
  if (!requireAdmin(ctx)) return;
  await ctx.conversation.enter("updateBranchConversation");
});

bot.hears(allVariants("btn_menu_delete_branch"), async (ctx) => {
  if (!requireAdmin(ctx)) return;
  await ctx.conversation.enter("deleteBranchConversation");
});

bot.hears(allVariants("btn_menu_list_branches"), async (ctx) => {
  if (!requireAdmin(ctx)) return;
  await handleListBranches(ctx);
});

// Manager buttons (admin)
bot.hears(allVariants("btn_menu_add_manager"), async (ctx) => {
  if (!requireAdmin(ctx)) return;
  await ctx.conversation.enter("addManagerConversation");
});

bot.hears(allVariants("btn_menu_update_manager"), async (ctx) => {
  if (!requireAdmin(ctx)) return;
  await ctx.conversation.enter("updateManagerConversation");
});

bot.hears(allVariants("btn_menu_delete_manager"), async (ctx) => {
  if (!requireAdmin(ctx)) return;
  await ctx.conversation.enter("deleteManagerConversation");
});

bot.hears(allVariants("btn_menu_list_managers"), async (ctx) => {
  if (!requireAdmin(ctx)) return;
  await handleListManagers(ctx);
});

// Client buttons
bot.hears(allVariants("btn_menu_add_client"), async (ctx) => {
  if (!requireBranch(ctx)) return;
  await ctx.conversation.enter("addClientConversation");
});

bot.hears(allVariants("btn_menu_list_clients"), async (ctx) => {
  if (!requireAuth(ctx)) return;
  await ctx.conversation.enter("listClientsConversation");
});

bot.hears(allVariants("btn_menu_get_client_info"), async (ctx) => {
  if (!requireAuth(ctx)) return;
  await ctx.conversation.enter("getClientInfoConversation");
});

bot.hears(allVariants("btn_menu_change_client_status"), async (ctx) => {
  if (!requireBranch(ctx)) return;
  await ctx.conversation.enter("changeClientStatusConversation");
});

// Statistics & import (admin)
bot.hears(allVariants("btn_menu_statistics"), async (ctx) => {
  if (!requireAdmin(ctx)) return;
  await ctx.conversation.enter("statisticsConversation");
});

bot.hears(allVariants("btn_menu_import"), async (ctx) => {
  if (!requireAdmin(ctx)) return;
  await ctx.conversation.enter("importConversation");
});

// ── Callback queries ──────────────────────────────────────────────────────────

bot.callbackQuery(/^lang:/, handleLangCallback);

// Inline status change from get_client_info keyboard
bot.callbackQuery(/^status:/, async (ctx) => {
  const lang = ctx.session.lang;

  if (!ctx.session.credentialId) {
    await ctx.answerCallbackQuery(t(lang, "not_logged_in"));
    return;
  }

  const [, idStr, newStatus] = ctx.callbackQuery.data.split(":");
  const clientId = parseInt(idStr, 10);

  const client = getClientById(clientId);
  if (!client) {
    await ctx.answerCallbackQuery(t(lang, "client_not_found", { id: clientId }));
    return;
  }

  if (client.buying_status !== "in_progress") {
    await ctx.answerCallbackQuery(t(lang, "change_client_status_not_in_progress"));
    return;
  }

  // Branch can only change their own clients
  if (ctx.session.type === "branch" && client.branch_id !== ctx.session.branchId) {
    await ctx.answerCallbackQuery(t(lang, "change_client_status_wrong_branch", { id: clientId }));
    return;
  }

  updateClientStatus(clientId, newStatus as ClientStatus);

  const statusIcon: Record<string, string> = { sale: "🟢", cancelled: "🔴" };
  const icon = statusIcon[newStatus] ?? "";

  const originalText = ctx.callbackQuery.message?.text ?? "";
  const updatedText = originalText.replace("🟡 in_progress", `${icon} ${newStatus}`);
  await ctx.editMessageText(updatedText);

  await ctx.answerCallbackQuery(
    t(lang, "change_client_status_success", { id: clientId, status: newStatus })
  );
});

// Catch-all for unhandled callbacks
bot.on("callback_query", (ctx) => ctx.answerCallbackQuery());

// ── Error handler ─────────────────────────────────────────────────────────────

bot.catch((err) => {
  console.error("Bot error:", err);
});

// ── Start ─────────────────────────────────────────────────────────────────────

bot.start();
console.log("Bot is running…");
