/**
 * i18next bootstrap for the GoPDF.js docs site.
 */
import { initI18n, i18nInstance } from '@wsxjs/wsx-i18next';

/** Relative to page URL — works for `/` dev and `/gopdfjs/` GitHub Pages without fetch patching. */
const LOCALE_LOAD_PATH = 'locales/{{lng}}/{{ns}}.json';

export const i18n = initI18n({
  fallbackLng: 'en',
  debug: false,
  backend: {
    loadPath: LOCALE_LOAD_PATH,
  },
  ns: ['home', 'common', 'footer', 'packages'],
  defaultNS: 'common',
});

export { i18nInstance };
