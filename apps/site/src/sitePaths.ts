/** Join Vite `base` with a public asset path (no leading slash on `relativePath`). */
export function joinBasePath(base: string, relativePath: string): string {
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return `${normalizedBase}${relativePath.replace(/^\//, '')}`;
}
