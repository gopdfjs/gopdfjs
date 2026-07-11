import type { Plugin } from 'vite';

/** Rewrite wsx-press client fetch URLs at compile time (source transform, not bundle patch). */
export function wsxPressBasePlugin(siteBase: string): Plugin {
  if (siteBase === '/' || siteBase === '') {
    return { name: 'wsx-press-base-noop' };
  }

  const normalizedBase = siteBase.endsWith('/') ? siteBase.slice(0, -1) : siteBase;

  return {
    name: 'wsx-press-base',
    enforce: 'pre',
    transform(code, id) {
      if (!id.includes('@wsxjs/wsx-press') || !id.includes('/client/')) {
        return null;
      }

      const next = code
        .replaceAll('"/.wsx-press/', `"${normalizedBase}/.wsx-press/`)
        .replaceAll("'/.wsx-press/", `'${normalizedBase}/.wsx-press/`)
        .replaceAll('`/docs/', `\`${normalizedBase}/docs/`)
        .replaceAll(
          'routeInfo.path.startsWith("/docs/")',
          "routeInfo.path.includes('/docs/')",
        )
        .replaceAll(
          'routeInfo.path.slice(6); // 移除 "/docs/"',
          "routeInfo.path.split('/docs/')[1] || '';",
        )
        .replaceAll(
          'routeInfo.path.slice(6); // 移除 "/docs/" 前缀',
          "routeInfo.path.split('/docs/')[1] || '';",
        );

      return next === code ? null : { code: next, map: null };
    },
  };
}
