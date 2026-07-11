import { describe, expect, it } from 'vitest';
import { pathnameToHashRoute } from './ghPagesHashFallback';

describe('pathnameToHashRoute', () => {
  const base = '/gopdfjs/';

  it('returns null for site index paths', () => {
    expect(pathnameToHashRoute('/gopdfjs', base)).toBeNull();
    expect(pathnameToHashRoute('/gopdfjs/', base)).toBeNull();
    expect(pathnameToHashRoute('/gopdfjs/index.html', base)).toBeNull();
  });

  it('maps deep paths to hash route segments', () => {
    expect(pathnameToHashRoute('/gopdfjs/docs/guide/getting-started', base)).toBe(
      'docs/guide/getting-started',
    );
    expect(pathnameToHashRoute('/gopdfjs/packages', base)).toBe('packages');
  });

  it('ignores paths outside project base', () => {
    expect(pathnameToHashRoute('/other/docs/foo', base)).toBeNull();
  });

  it('no-ops for root dev base', () => {
    expect(pathnameToHashRoute('/docs/guide/foo', '/')).toBeNull();
  });
});
