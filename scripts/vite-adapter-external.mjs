/** Adapter publish build: bundle internal @gopdfjs/* except published `@gopdfjs/engine`. */

/**
 * @param {string} id
 * @param {readonly string[]} npmPackages — published `dependencies` keys only
 */
export function adapterExternal(id, npmPackages) {
  if (id === "@gopdfjs/engine" || id.startsWith("@gopdfjs/engine/")) return true;
  if (id.startsWith("@gopdfjs/")) return false;
  if (id.startsWith("node:")) return true;
  return npmPackages.some((name) => id === name || id.startsWith(`${name}/`));
}
