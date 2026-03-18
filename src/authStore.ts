import { CredentialType } from "./types";

interface AuthData {
  credentialId: number;
  login: string;
  type: CredentialType;
  branchId?: number;
}

const store = new Map<number, AuthData>();

export const authStore = {
  get(chatId: number): AuthData | undefined {
    return store.get(chatId);
  },
  set(chatId: number, data: AuthData): void {
    store.set(chatId, data);
  },
  clear(chatId: number): void {
    store.delete(chatId);
  },
};
