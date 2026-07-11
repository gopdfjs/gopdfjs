/**
 * GoPDF.js site — WSX entry (GitHub Pages docs landing).
 */

import { createLogger } from '@wsxjs/wsx-core';
import { normalizeSitePathname } from './sitePaths';
import 'uno.css';
import './main.css';
import '@wsxjs/wsx-base-components';
import '@wsxjs/wsx-router';
import './i18n';
import './App.wsx';

const logger = createLogger('GoPDF-Site');
const THEME_STORAGE_KEY = 'gopdf-theme';

function initTheme(): void {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'dark';
  const theme = savedTheme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  logger.info(`Theme initialized: ${theme}`);
}

function initApp(): void {
  normalizeSitePathname();
  initTheme();

  const appContainer = document.getElementById('app');
  if (!appContainer) {
    logger.error('App container not found');
    return;
  }

  appContainer.innerHTML = '<gopdf-app></gopdf-app>';
  logger.info('GoPDF.js site initialized');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
