/**
 * i18next bootstrap for the GoPDF.js docs site.
 */
import { initI18n, i18nInstance } from '@wsxjs/wsx-i18next';
import { SITE_BASE } from './sitePaths';

export const i18n = initI18n({
  fallbackLng: 'en',
  debug: false,
  backend: {
    loadPath: `${SITE_BASE}locales/{{lng}}/{{ns}}.json`,
  },
  ns: ['home', 'common', 'footer', 'packages'],
  defaultNS: 'common',
});

export { i18nInstance };
