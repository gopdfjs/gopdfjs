/**
 * Consumer-facing `@gopdfjs/engine` entry.
 *
 * Import **`Gopdf` methods** and **`createEngine`** here only.
 *
 * Boot: `@gopdfjs/adapter-browser` / `@gopdfjs/adapter-node` → `createBrowserGopdf()` / `createNodeGopdf()`.
 */

export type * from "./types";
export { createEngine } from "./createEngine";
