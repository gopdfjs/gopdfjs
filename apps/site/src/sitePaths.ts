/** Join Vite `base` with a public asset path (no leading slash on `relativePath`). */
export function joinBasePath(base: string, relativePath: string): string {
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return `${normalizedBase}${relativePath.replace(/^\//, '')}`;
}

/** `/` in dev · `/gopdfjs/` on GitHub Pages (`VITE_BASE`). */
export const SITE_BASE = import.meta.env.BASE_URL;

/** Injected at build time from vite.config `define` — reliable on GitHub Pages. */
declare const __GOPDF_LOCALE_LOAD_PATH__: string;

export const LOCALE_LOAD_PATH =
  typeof __GOPDF_LOCALE_LOAD_PATH__ !== 'undefined'
    ? __GOPDF_LOCALE_LOAD_PATH__
    : joinBasePath(SITE_BASE, 'locales/{{lng}}/{{ns}}.json');
