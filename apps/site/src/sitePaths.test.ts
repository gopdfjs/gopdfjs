import { describe, expect, it } from 'vitest';
import { joinBasePath, withSiteBase } from './sitePaths';

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

describe('withSiteBase', () => {
  it('prefixes root-relative asset paths', () => {
    expect(withSiteBase('/gopdfjs/', '/locales/en/home.json')).toBe('/gopdfjs/locales/en/home.json');
    expect(withSiteBase('/gopdfjs/', '/.wsx-press/docs-meta.json')).toBe(
      '/gopdfjs/.wsx-press/docs-meta.json',
    );
    expect(withSiteBase('/gopdfjs/', '/docs/guide/getting-started.md')).toBe(
      '/gopdfjs/docs/guide/getting-started.md',
    );
  });

  it('leaves absolute and external URLs unchanged', () => {
    expect(withSiteBase('/gopdfjs/', '/')).toBe('/gopdfjs/');
    expect(withSiteBase('/gopdfjs/', '//cdn.example.com/x.json')).toBe('//cdn.example.com/x.json');
    expect(withSiteBase('/', '/locales/en/home.json')).toBe('/locales/en/home.json');
  });
});
