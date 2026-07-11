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
