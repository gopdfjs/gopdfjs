import { createEngine } from "@gopdfjs/engine";
import type { Gopdf } from "@gopdfjs/engine";
import { createBrowserAdapter } from "@gopdfjs/adapter-browser";

let gopdfPromise: Promise<Gopdf> | null = null;

/** Lazily init browser adapter + unified GoPDF engine facade. */
export function getBrowserEngine(): Promise<Gopdf> {
  gopdfPromise ??= createBrowserAdapter().then((adapter) => createEngine(adapter));
  return gopdfPromise;
}
