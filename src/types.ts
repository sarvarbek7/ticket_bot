import { Context, SessionFlavor } from "grammy";
import { ConversationFlavor } from "@grammyjs/conversations";
import type { Conversation } from "@grammyjs/conversations";

export type Lang = "en" | "ru" | "uz";
export type CredentialType = "admin" | "branch";
export type ClientStatus = "in_progress" | "sale" | "cancelled";

export interface SessionData {
  credentialId?: number;
  login?: string;
  type?: CredentialType;
  branchId?: number; // set for branch type
  lang: Lang;
}

export type MyContext = Context & SessionFlavor<SessionData> & ConversationFlavor;
export type MyConversation = Conversation<MyContext>;

export interface DbCredential {
  id: number;
  login: string;
  password: string;
  type: CredentialType;
  is_active: number; // 1 = active, 0 = inactive
}

export interface DbBranch {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  credential_id: number;
  // joined from credentials
  login?: string;
  is_active?: number;
}

export interface DbManager {
  id: number;
  name: string;
  branch_id: number;
  is_active: number;
  // joined from branches
  branch_name?: string;
}

export interface DbClient {
  id: number;
  name: string;
  phone: string;
  direction_name: string;
  buying_status: ClientStatus;
  branch_id: number;
  manager_id: number;
  created_at?: string;
  // joined
  branch_name?: string;
  manager_name?: string;
}
