import { createBrowserGopdf } from "@gopdfjs/adapter-browser";
import type { Gopdf } from "@gopdfjs/engine";

let gopdfPromise: Promise<Gopdf> | null = null;

/** Lazily init browser adapter + unified GoPDF engine facade. */
export function getBrowserEngine(): Promise<Gopdf> {
  gopdfPromise ??= createBrowserGopdf();
  return gopdfPromise;
}
