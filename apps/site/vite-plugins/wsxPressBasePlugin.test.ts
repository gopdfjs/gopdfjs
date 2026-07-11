import { describe, expect, it } from 'vitest';

function transformWsxPressClient(code: string, siteBase: string): string {
  if (siteBase === '/' || siteBase === '') {
    return code;
  }

  const normalizedBase = siteBase.endsWith('/') ? siteBase.slice(0, -1) : siteBase;

  return code
    .replaceAll('"/.wsx-press/', `"${normalizedBase}/.wsx-press/`)
    .replaceAll('`/docs/', `\`${normalizedBase}/docs/`)
    .replaceAll(
      'routeInfo.path.startsWith("/docs/")',
      "routeInfo.path.includes('/docs/')",
    )
    .replaceAll(
      'routeInfo.path.slice(6); // 移除 "/docs/"',
      "routeInfo.path.split('/docs/')[1] || '';",
    );
}

describe('wsxPressBasePlugin transform', () => {
  it('rewrites fetch URLs and doc route parsing for GitHub Pages subpath', () => {
    const input = `
      fetch("/.wsx-press/docs-meta.json");
      const markdownPath = \`/docs/\${docPath}.md\`;
      if (routeInfo.path.startsWith("/docs/")) {
        docPath = routeInfo.path.slice(6); // 移除 "/docs/"
      }
    `;

    const output = transformWsxPressClient(input, '/gopdfjs/');
    expect(output).toContain('fetch("/gopdfjs/.wsx-press/docs-meta.json")');
    expect(output).toContain('`/gopdfjs/docs/${docPath}.md`');
    expect(output).toContain("routeInfo.path.includes('/docs/')");
    expect(output).toContain("routeInfo.path.split('/docs/')[1]");
  });

  it('leaves dev source unchanged', () => {
    const input = 'fetch("/.wsx-press/docs-meta.json");';
    expect(transformWsxPressClient(input, '/')).toBe(input);
  });
});
