/** GitHub Pages repo slug — project site lives at https://gopdfjs.github.io/gopdfjs/ */
export const GH_PAGES_REPO = 'gopdfjs';

/**
 * Vite `base` for the docs site.
 *
 * | Scenario                         | base        |
 * |----------------------------------|-------------|
 * | Local dev                        | `/`         |
 * | GH Pages + custom domain (CNAME) | `/`         |
 * | GH Pages project site (no CNAME) | `/gopdfjs/` |
 */
export function resolveSiteBase(): string {
  if (process.env.VITE_BASE) {
    return process.env.VITE_BASE;
  }

  const isGhPages = process.env.GITHUB_PAGES === 'true';
  const hasCustomDomain = process.env.CUSTOM_DOMAIN === 'true';

  if (isGhPages && !hasCustomDomain) {
    return `/${GH_PAGES_REPO}/`;
  }

  return '/';
}
