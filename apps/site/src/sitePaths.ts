/** Join Vite `base` with a public asset path (no leading slash on `relativePath`). */
export function joinBasePath(base: string, relativePath: string): string {
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return `${normalizedBase}${relativePath.replace(/^\//, '')}`;
}

/** Rewrite root-relative fetch URLs for GitHub Pages project sites. */
export function withSiteBase(base: string, url: string): string {
  if (!url.startsWith('/') || url.startsWith('//')) {
    return url;
  }
  if (base === '/' || base === '') {
    return url;
  }
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  // Already under site base (e.g. i18n loadPath) — avoid /gopdfjs/gopdfjs/...
  if (url === normalizedBase || url.startsWith(`${normalizedBase}/`)) {
    return url;
  }
  return `${normalizedBase}${url}`;
}

declare const __GOPDF_SITE_BASE__: string;
declare const __GOPDF_LOCALE_LOAD_PATH__: string;

/** `/` in dev · `/gopdfjs/` on GitHub Pages (`VITE_BASE`). */
export const SITE_BASE =
  typeof __GOPDF_SITE_BASE__ !== 'undefined' ? __GOPDF_SITE_BASE__ : import.meta.env.BASE_URL;

export const LOCALE_LOAD_PATH =
  typeof __GOPDF_LOCALE_LOAD_PATH__ !== 'undefined'
    ? __GOPDF_LOCALE_LOAD_PATH__
    : joinBasePath(SITE_BASE, 'locales/{{lng}}/{{ns}}.json');

/** Prefix root-relative fetches when hosted under a subpath (e.g. GitHub Pages). */
export function installFetchBase(base: string = SITE_BASE): void {
  if (typeof window === 'undefined' || base === '/' || base === '') {
    return;
  }

  const originalFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    if (typeof input === 'string') {
      return originalFetch(withSiteBase(base, input), init);
    }
    if (input instanceof URL && input.origin === window.location.origin) {
      return originalFetch(withSiteBase(base, input.pathname + input.search + input.hash), init);
    }
    return originalFetch(input, init);
  };
}
