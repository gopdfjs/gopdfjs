import type { AbstractIntlMessages } from "use-intl";
import type { AppLocale } from "./locales";
import { locales } from "./locales";

/** Default JSON message path for monorepo apps (next-intl / use-intl). */
export const MESSAGES_DIR = "site/messages";

export function messagesFileName(locale: AppLocale): string {
  return `${locale}.json`;
}

/** Type guard for static JSON imports in Vite apps. */
export function isAppLocale(value: string): value is AppLocale {
  return (locales as readonly string[]).includes(value);
}

export type AppMessages = AbstractIntlMessages;
