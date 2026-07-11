/**
 * Consumer-facing `@gopdfjs/engine` entry.
 *
 * Import **`Gopdf` types** and **`createEngine(adapter)`** here only.
 * Env-specific hosts supply the adapter port bundle (browser / Node packages); engine does not import them.
 */

export type * from "./types";
export { createEngine } from "./createEngine";
