import { describe, expect, it } from 'vitest';
import { joinBasePath } from './sitePaths';

describe('joinBasePath', () => {
  it('prefixes GitHub Pages project base', () => {
    expect(joinBasePath('/gopdfjs/', 'locales/{{lng}}/{{ns}}.json')).toBe(
      '/gopdfjs/locales/{{lng}}/{{ns}}.json',
    );
  });

  it('works with root base for local dev', () => {
    expect(joinBasePath('/', 'locales/en/home.json')).toBe('/locales/en/home.json');
  });
});

describe('rewriteSubpathFetches', () => {
  const WSX_PRESS_FETCH = '/.wsx-press/';
  const DOCS_FETCH = '/docs/';

  function rewrite(code: string, siteBase: string): string {
    if (siteBase === '/' || siteBase === '') {
      return code;
    }
    const normalizedBase = siteBase.endsWith('/') ? siteBase.slice(0, -1) : siteBase;
    return code
      .replaceAll(`"${WSX_PRESS_FETCH}`, `"${normalizedBase}${WSX_PRESS_FETCH}`)
      .replaceAll(`'${WSX_PRESS_FETCH}`, `'${normalizedBase}${WSX_PRESS_FETCH}`)
      .replaceAll(`"${DOCS_FETCH}`, `"${normalizedBase}${DOCS_FETCH}`)
      .replaceAll(`'${DOCS_FETCH}`, `'${normalizedBase}${DOCS_FETCH}`);
  }

  it('rewrites wsx-press and docs fetch paths for GitHub Pages', () => {
    const input = 'fetch("/.wsx-press/docs-meta.json");fetch("/docs/guide/x.md");';
    expect(rewrite(input, '/gopdfjs/')).toBe(
      'fetch("/gopdfjs/.wsx-press/docs-meta.json");fetch("/gopdfjs/docs/guide/x.md");',
    );
  });

  it('leaves bundle unchanged for root base dev', () => {
    const input = 'fetch("/.wsx-press/docs-meta.json");';
    expect(rewrite(input, '/')).toBe(input);
  });
});
