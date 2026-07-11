/**
 * Generate sitemap.xml for GitHub Pages hash-router site.
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

const BASE_URL = process.env.VITE_SITE_URL || 'https://gopdfjs.github.io/gopdfjs';

const routes = [
  '/',
  '/packages',
  '/docs/guide/getting-started',
  '/docs/guide/ai-help',
  '/docs/guide/installation',
  '/docs/guide/browser',
  '/docs/guide/node',
  '/docs/api/engine',
  '/docs/api/gopdf-methods',
  '/docs/faq/index',
];

function toHashUrl(route: string): string {
  if (route === '/') {
    return `${BASE_URL}/#/`;
  }
  return `${BASE_URL}/#${route}`;
}

function generateSitemap(): string {
  const urls = routes
    .map(
      (route) => `  <url>
    <loc>${toHashUrl(route)}</loc>
    <changefreq>weekly</changefreq>
    <priority>${route === '/' ? '1.0' : '0.8'}</priority>
  </url>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

const outputPath = join(process.cwd(), 'public', 'sitemap.xml');
writeFileSync(outputPath, generateSitemap(), 'utf-8');
console.log(`✅ Sitemap generated: ${outputPath}`);
