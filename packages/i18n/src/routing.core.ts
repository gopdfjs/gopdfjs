import { locales, type AppLocale } from "./locales";

export { locales, type AppLocale };

/**
 * Locale 前缀路由配置（原 next-intl defineRouting；现用于 SPA + 共享包）。
 */
export const routing = {
  locales: [...locales] as AppLocale[],
  defaultLocale: "en-US" as const,
};
