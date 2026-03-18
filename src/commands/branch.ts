import { InlineKeyboard } from "grammy";
import { MyContext, MyConversation } from "../types";
import { t } from "../locales";
import {
  getAllBranches,
  createCredential,
  findCredentialByLogin,
  createBranch,
  updateBranch,
  updateCredentialLoginPassword,
  updateCredentialLogin,
  deactivateCredential,
  getBranchById,
} from "../db";

// ── /add_branch ──────────────────────────────────────────────────────────────

export async function addBranchConversation(
  conversation: MyConversation,
  ctx: MyContext
): Promise<void> {
  const lang = ctx.session.lang;

  await ctx.reply(t(lang, "add_branch_prompt_name"));
  const nameCtx = await conversation.waitFor("message:text");
  const name = nameCtx.message.text.trim();

  await ctx.reply(t(lang, "add_branch_prompt_location"));
  let latitude: number;
  let longitude: number;

  while (true) {
    const locCtx = await conversation.wait();
    if (locCtx.message?.location) {
      latitude = locCtx.message.location.latitude;
      longitude = locCtx.message.location.longitude;
      break;
    }
    await ctx.reply(t(lang, "add_branch_prompt_location"));
  }

  await ctx.reply(t(lang, "add_branch_prompt_login"));
  const loginCtx = await conversation.waitFor("message:text");
  const login = loginCtx.message.text.trim();

  if (findCredentialByLogin(login)) {
    await ctx.reply(t(lang, "add_branch_login_exists", { login }));
    return;
  }

  await ctx.reply(t(lang, "add_branch_prompt_password"));
  const passwordCtx = await conversation.waitFor("message:text");
  const password = passwordCtx.message.text.trim();

  const credId = createCredential(login, password, "branch");
  createBranch(name, latitude, longitude, credId);

  await ctx.reply(t(lang, "add_branch_success", { name, login }));
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

  await ctx.reply(t(lang, "update_branch_prompt_name", { name: branch.name }));
  const nameCtx = await conversation.waitFor("message:text");
  const newName = nameCtx.message.text.trim();

  await ctx.reply(t(lang, "update_branch_prompt_location"));
  let latitude = branch.latitude;
  let longitude = branch.longitude;

  const locCtx = await conversation.wait();
  if (locCtx.message?.location) {
    latitude = locCtx.message.location.latitude;
    longitude = locCtx.message.location.longitude;
  }
  // if text (skip or anything else), keep existing coordinates

  await ctx.reply(t(lang, "update_branch_prompt_login", { login: branch.login ?? "" }));
  const loginCtx = await conversation.waitFor("message:text");
  const newLogin = loginCtx.message.text.trim();

  await ctx.reply(t(lang, "update_branch_prompt_password"));
  const passwordCtx = await conversation.waitFor("message:text");
  const newPassword = passwordCtx.message.text.trim();

  updateBranch(branchId, newName, latitude, longitude);
  if (newPassword.toLowerCase() === "skip") {
    updateCredentialLogin(branch.credential_id, newLogin);
  } else {
    updateCredentialLoginPassword(branch.credential_id, newLogin, newPassword);
  }

  await ctx.reply(t(lang, "update_branch_success", { name: newName }));
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

  await ctx.reply(t(lang, "delete_branch_success", { name: branch.name }));
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
