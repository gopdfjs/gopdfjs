/** Rollup `external` helpers for Vite library builds (RFC 0058 §3.5). */

/**
 * @param {string} id
 * @param {readonly string[]} npmPackages — package.json `dependencies` keys
 */
export function externalNpmOnly(id, npmPackages) {
  if (id.startsWith("@gopdfjs/")) return false;
  return npmPackages.some((name) => id === name || id.startsWith(`${name}/`));
}

/**
 * @param {string} id
 * @param {readonly string[]} bundlePrefixes — workspace packages to inline
 * @param {readonly string[]} npmPackages
 */
export function externalWithBundledGopdf(id, bundlePrefixes, npmPackages) {
  if (bundlePrefixes.some((prefix) => id === prefix || id.startsWith(`${prefix}/`))) {
    return false;
  }
  if (id.startsWith("@gopdfjs/")) return true;
  return npmPackages.some((name) => id === name || id.startsWith(`${name}/`));
}
