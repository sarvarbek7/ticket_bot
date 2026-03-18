import { Keyboard } from "grammy";
import { CredentialType, Lang } from "../types";
import { t } from "../locales";
import { en } from "../locales/en";
import { ru } from "../locales/ru";
import { uz } from "../locales/uz";

type BtnKey = keyof typeof en;

export type AdminSubMenu = "admin" | "branch" | "manager";

export function buildMenuKeyboard(type: CredentialType, lang: Lang): Keyboard {
  const b = (key: BtnKey) => t(lang, key);

  if (type === "admin") {
    return new Keyboard()
      .text(b("btn_menu_admin_management")).row()
      .text(b("btn_menu_branch_management")).row()
      .text(b("btn_menu_manager_management")).row()
      .text(b("btn_menu_list_clients")).row()
      .text(b("btn_menu_statistics")).text(b("btn_menu_import")).row()
      .text(b("btn_menu_cancel")).text(b("btn_menu_logout")).row()
      .text(b("btn_menu_change_language"))
      .resized()
      .persistent();
  }

  // branch
  return new Keyboard()
    .text(b("btn_menu_add_client")).text(b("btn_menu_list_clients")).row()
    .text(b("btn_menu_get_client_info")).text(b("btn_menu_change_client_status")).row()
    .text(b("btn_menu_cancel")).text(b("btn_menu_logout")).row()
    .text(b("btn_menu_change_language"))
    .resized()
    .persistent();
}

export function buildGuestKeyboard(lang: Lang): Keyboard {
  const b = (key: BtnKey) => t(lang, key);

  return new Keyboard()
    .text(b("btn_menu_start")).text(b("btn_menu_login")).row()
    .text(b("btn_menu_change_language"))
    .resized()
    .persistent();
}

export function buildAdminSubKeyboard(group: AdminSubMenu, lang: Lang): Keyboard {
  const b = (key: BtnKey) => t(lang, key);

  if (group === "admin") {
    return new Keyboard()
      .text(b("btn_menu_add_admin")).text(b("btn_menu_update_admin")).row()
      .text(b("btn_menu_delete_admin")).text(b("btn_menu_list_admins")).row()
      .text(b("btn_menu_back"))
      .resized()
      .persistent();
  }

  if (group === "branch") {
    return new Keyboard()
      .text(b("btn_menu_add_branch")).text(b("btn_menu_update_branch")).row()
      .text(b("btn_menu_delete_branch")).text(b("btn_menu_list_branches")).row()
      .text(b("btn_menu_back"))
      .resized()
      .persistent();
  }

  // manager
  return new Keyboard()
    .text(b("btn_menu_add_manager")).text(b("btn_menu_update_manager")).row()
    .text(b("btn_menu_delete_manager")).text(b("btn_menu_list_managers")).row()
    .text(b("btn_menu_back"))
    .resized()
    .persistent();
}

/** Collects all locale variants of a button label for use with bot.hears() */
export function allVariants(key: BtnKey): string[] {
  return [en[key], ru[key], uz[key]] as string[];
}
