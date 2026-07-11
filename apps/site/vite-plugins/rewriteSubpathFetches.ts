import type { Plugin } from 'vite';

const WSX_PRESS_FETCH = '/.wsx-press/';
const DOCS_FETCH = '/docs/';

/** Rewrite wsx-press root-absolute fetch strings for GitHub Pages subpath deploys. */
export function rewriteSubpathFetches(siteBase: string): Plugin {
  if (siteBase === '/' || siteBase === '') {
    return { name: 'rewrite-subpath-fetches-noop' };
  }

  const normalizedBase = siteBase.endsWith('/') ? siteBase.slice(0, -1) : siteBase;

  return {
    name: 'rewrite-subpath-fetches',
    apply: 'build',
    generateBundle(_options, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type !== 'chunk') {
          continue;
        }

        file.code = file.code
          .replaceAll(`"${WSX_PRESS_FETCH}`, `"${normalizedBase}${WSX_PRESS_FETCH}`)
          .replaceAll(`'${WSX_PRESS_FETCH}`, `'${normalizedBase}${WSX_PRESS_FETCH}`)
          .replaceAll(`"${DOCS_FETCH}`, `"${normalizedBase}${DOCS_FETCH}`)
          .replaceAll(`'${DOCS_FETCH}`, `'${normalizedBase}${DOCS_FETCH}`);
      }
    },
  };
}
