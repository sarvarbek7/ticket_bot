import { InlineKeyboard, Keyboard } from "grammy";
import { MyContext, MyConversation } from "../types";
import { t } from "../locales";
import { buildAdminSubKeyboard } from "../utils/keyboard";
import {
  getAllBranches,
  createCredential,
  findCredentialByLogin,
  createBranch,
  updateBranch,
  updateCredentialLoginPassword,
  updateCredentialLogin,
  setCredentialActive,
  deactivateCredential,
  getBranchById,
} from "../db";

// ── /add_branch ──────────────────────────────────────────────────────────────

export async function addBranchConversation(
  conversation: MyConversation,
  ctx: MyContext
): Promise<void> {
  const lang = ctx.session.lang;
  const cancelKb = new Keyboard().text(t(lang, "btn_menu_cancel")).resized();

  await ctx.reply(t(lang, "add_branch_prompt_name"), { reply_markup: cancelKb });
  const nameCtx = await conversation.waitFor("message:text");
  const name = nameCtx.message.text.trim();

  await ctx.reply(t(lang, "add_branch_prompt_location"), { reply_markup: cancelKb });
  let latitude: number;
  let longitude: number;

  while (true) {
    const locCtx = await conversation.wait();
    if (locCtx.message?.location) {
      latitude = locCtx.message.location.latitude;
      longitude = locCtx.message.location.longitude;
      break;
    }
    await ctx.reply(t(lang, "add_branch_prompt_location"), { reply_markup: cancelKb });
  }

  await ctx.reply(t(lang, "add_branch_prompt_login"), { reply_markup: cancelKb });
  const loginCtx = await conversation.waitFor("message:text");
  const login = loginCtx.message.text.trim();

  if (findCredentialByLogin(login)) {
    await ctx.reply(t(lang, "add_branch_login_exists", { login }));
    return;
  }

  await ctx.reply(t(lang, "add_branch_prompt_password"), { reply_markup: cancelKb });
  const passwordCtx = await conversation.waitFor("message:text");
  const password = passwordCtx.message.text.trim();

  const credId = createCredential(login, password, "branch");
  createBranch(name, latitude, longitude, credId);

  await ctx.reply(t(lang, "add_branch_success", { name, login }), {
    reply_markup: buildAdminSubKeyboard("branch", lang),
  });
}

// ── /update_branch ───────────────────────────────────────────────────────────

export async function updateBranchConversation(
  conversation: MyConversation,
  ctx: MyContext
): Promise<void> {
  const lang = ctx.session.lang;
  const branches = getAllBranches();

  if (branches.length === 0) {
    await ctx.reply(t(lang, "update_branch_no_branches"));
    return;
  }

  const kb = new InlineKeyboard();
  for (const b of branches) {
    kb.text(b.name, `updbranch:${b.id}`).row();
  }

  await ctx.reply(t(lang, "update_branch_select"), { reply_markup: kb });

  const selCtx = await conversation.waitFor("callback_query:data");
  await selCtx.answerCallbackQuery();
  const branchId = parseInt(selCtx.callbackQuery.data.split(":")[1], 10);

  const branch = getBranchById(branchId);
  if (!branch) {
    await ctx.reply(t(lang, "update_branch_no_branches"));
    return;
  }

  const cancelKb = new Keyboard().text(t(lang, "btn_menu_cancel")).resized();

  await ctx.reply(t(lang, "update_branch_prompt_name", { name: branch.name }), { reply_markup: cancelKb });
  const nameCtx = await conversation.waitFor("message:text");
  const newName = nameCtx.message.text.trim();

  await ctx.reply(t(lang, "update_branch_prompt_location"), { reply_markup: cancelKb });
  let latitude = branch.latitude;
  let longitude = branch.longitude;

  const locCtx = await conversation.wait();
  if (locCtx.message?.location) {
    latitude = locCtx.message.location.latitude;
    longitude = locCtx.message.location.longitude;
  }
  // any text (e.g. "skip") keeps existing coordinates

  await ctx.reply(t(lang, "update_branch_prompt_login", { login: branch.login ?? "" }), { reply_markup: cancelKb });
  const loginCtx = await conversation.waitFor("message:text");
  const newLogin = loginCtx.message.text.trim();

  await ctx.reply(t(lang, "update_branch_prompt_password"), { reply_markup: cancelKb });
  const passwordCtx = await conversation.waitFor("message:text");
  const newPassword = passwordCtx.message.text.trim();

  updateBranch(branchId, newName, latitude, longitude);
  if (newPassword.toLowerCase() === "skip") {
    updateCredentialLogin(branch.credential_id, newLogin);
  } else {
    updateCredentialLoginPassword(branch.credential_id, newLogin, newPassword);
  }

  // Toggle active status
  const currentStatus = branch.is_active !== 0 ? t(lang, "branch_active") : t(lang, "branch_inactive");
  const toggleKb = new InlineKeyboard()
    .text(t(lang, "toggle_active_activate"), "togglebranch:activate")
    .text(t(lang, "toggle_active_deactivate"), "togglebranch:deactivate").row()
    .text(t(lang, "toggle_active_skip"), "togglebranch:skip");
  await ctx.reply(t(lang, "toggle_active_prompt", { status: currentStatus }), { reply_markup: toggleKb });

  const toggleCtx = await conversation.waitFor("callback_query:data");
  await toggleCtx.answerCallbackQuery();
  const toggleAction = toggleCtx.callbackQuery.data.split(":")[1];
  if (toggleAction === "activate") setCredentialActive(branch.credential_id, true);
  else if (toggleAction === "deactivate") setCredentialActive(branch.credential_id, false);

  await ctx.reply(t(lang, "update_branch_success", { name: newName }), {
    reply_markup: buildAdminSubKeyboard("branch", lang),
  });
}

// ── /delete_branch ───────────────────────────────────────────────────────────

export async function deleteBranchConversation(
  conversation: MyConversation,
  ctx: MyContext
): Promise<void> {
  const lang = ctx.session.lang;
  const branches = getAllBranches().filter((b) => b.is_active !== 0);

  if (branches.length === 0) {
    await ctx.reply(t(lang, "delete_branch_no_branches"));
    return;
  }

  const kb = new InlineKeyboard();
  for (const b of branches) {
    kb.text(b.name, `delbranch:${b.id}`).row();
  }

  await ctx.reply(t(lang, "delete_branch_select"), { reply_markup: kb });

  const selCtx = await conversation.waitFor("callback_query:data");
  await selCtx.answerCallbackQuery();
  const branchId = parseInt(selCtx.callbackQuery.data.split(":")[1], 10);

  const branch = getBranchById(branchId);
  if (!branch) return;

  deactivateCredential(branch.credential_id);

  await ctx.reply(t(lang, "delete_branch_success", { name: branch.name }), {
    reply_markup: buildAdminSubKeyboard("branch", lang),
  });
}

// ── /list_branches ────────────────────────────────────────────────────────────

export async function handleListBranches(ctx: MyContext): Promise<void> {
  const lang = ctx.session.lang;
  const branches = getAllBranches();

  if (branches.length === 0) {
    await ctx.reply(t(lang, "list_branches_empty"));
    return;
  }

  const rows = branches.map((b) => {
    const status =
      b.is_active !== 0
        ? t(lang, "branch_active")
        : t(lang, "branch_inactive");
    return t(lang, "branch_row", {
      status,
      name: b.name,
      login: b.login ?? "—",
      lat: b.latitude.toFixed(4),
      lon: b.longitude.toFixed(4),
    });
  });

  await ctx.reply(t(lang, "list_branches_header") + rows.join("\n"));
}
