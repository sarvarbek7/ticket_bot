import { en } from "./en";
import { ru } from "./ru";
import { uz } from "./uz";
import { Lang } from "../types";

type TranslationKey = keyof typeof en;

const locales: Record<Lang, typeof en> = { en, ru, uz };

export function t(
  lang: Lang,
  key: TranslationKey,
  params?: Record<string, string | number>
): string {
  const locale = locales[lang] ?? locales.en;
  let text: string = (locale as Record<string, string>)[key] ?? (en as Record<string, string>)[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replaceAll(`{${k}}`, String(v));
    }
  }
  return text;
}
