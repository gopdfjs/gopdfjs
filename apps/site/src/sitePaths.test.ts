import { describe, expect, it } from 'vitest';
import { joinSitePath } from './sitePaths';

describe('joinSitePath', () => {
  it('returns root for home in dev', () => {
    expect(joinSitePath('/', '/')).toBe('/');
    expect(joinSitePath('/', '/packages')).toBe('/packages');
  });

  it('prefixes routes with GitHub Pages base', () => {
    expect(joinSitePath('/gopdfjs/', '/')).toBe('/gopdfjs/');
    expect(joinSitePath('/gopdfjs/', '/packages')).toBe('/gopdfjs/packages');
    expect(joinSitePath('/gopdfjs/', '/docs/guide/getting-started')).toBe(
      '/gopdfjs/docs/guide/getting-started',
    );
  });
});
