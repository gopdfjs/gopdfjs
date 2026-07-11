/** Map a GitHub Pages pathname under project base to a hash route segment. */
export function pathnameToHashRoute(pathname: string, siteBase: string): string | null {
  if (siteBase === '/' || siteBase === '') {
    return null;
  }

  const base = siteBase.endsWith('/') ? siteBase.slice(0, -1) : siteBase;
  if (pathname === base || pathname === `${base}/` || pathname === `${base}/index.html`) {
    return null;
  }

  if (!pathname.startsWith(`${base}/`)) {
    return null;
  }

  let route = pathname.slice(base.length + 1);
  if (route.endsWith('/index.html')) {
    route = route.slice(0, -'/index.html'.length);
  }
  route = route.replace(/\/+$/, '');

  return route || null;
}

/** Inline script for 404.html — convert path URLs to hash routes, never drop the path. */
export function buildGhPagesHashFallbackScript(siteBase: string): string {
  const baseLiteral = JSON.stringify(siteBase);

  return `(function () {
  var BASE = ${baseLiteral};
  var location = window.location;
  var pathname = location.pathname;
  var search = location.search;
  var hash = location.hash;

  if (hash) {
    return;
  }

  var base = BASE.endsWith('/') ? BASE.slice(0, -1) : BASE;
  if (pathname === base || pathname === base + '/' || pathname === base + '/index.html') {
    return;
  }

  if (pathname.indexOf(base + '/') === 0) {
    var route = pathname.slice(base.length + 1);
    if (route.endsWith('/index.html')) {
      route = route.slice(0, -11);
    }
    route = route.replace(/\\/+$/, '');
    if (route) {
      location.replace(BASE + '#/' + route + search);
      return;
    }
  }

  location.replace(BASE + search);
})();`;
}
