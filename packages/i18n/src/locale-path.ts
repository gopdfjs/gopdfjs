/**
 * 生成带 locale 前缀的 in-app 路径（不含 Vite / BrowserRouter basename）。
 */
export function joinLocalePath(locale: string, href: string): string {
  const path = href.startsWith("/") ? href : `/${href}`;
  if (path === "/") {
    return `/${locale}`;
  }
  return `/${locale}${path}`;
}
