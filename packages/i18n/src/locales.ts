/** Supported UI locales (single source of truth for routing + LanguagePicker). */
export const locales = [
  "zh-CN",
  "zh-TW",
  "ja",
  "ko",
  "en-US",
  "en-GB",
  "en-CA",
  "fr",
  "es",
  "de",
  "ru",
] as const;

export type AppLocale = (typeof locales)[number];
