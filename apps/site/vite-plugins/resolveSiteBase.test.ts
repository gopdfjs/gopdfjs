import { afterEach, describe, expect, it } from 'vitest';
import { GH_PAGES_REPO, resolveSiteBase } from './resolveSiteBase';

describe('resolveSiteBase', () => {
  const env = process.env;

  afterEach(() => {
    process.env = env;
  });

  it('defaults to root for local dev', () => {
    delete process.env.VITE_BASE;
    delete process.env.GITHUB_PAGES;
    delete process.env.CUSTOM_DOMAIN;
    expect(resolveSiteBase()).toBe('/');
  });

  it('uses project subpath for GH Pages without custom domain', () => {
    process.env.GITHUB_PAGES = 'true';
    delete process.env.CUSTOM_DOMAIN;
    expect(resolveSiteBase()).toBe(`/${GH_PAGES_REPO}/`);
  });

  it('uses root for GH Pages with custom domain', () => {
    process.env.GITHUB_PAGES = 'true';
    process.env.CUSTOM_DOMAIN = 'true';
    expect(resolveSiteBase()).toBe('/');
  });

  it('honours explicit VITE_BASE override', () => {
    process.env.VITE_BASE = '/custom/';
    expect(resolveSiteBase()).toBe('/custom/');
  });
});
