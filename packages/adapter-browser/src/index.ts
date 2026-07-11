import type { GopdfAdapter } from "@gopdfjs/adapter/adapter";
import type { Gopdf } from "@gopdfjs/engine";
import { createEngine } from "@gopdfjs/engine";
import { createBrowserAdapter } from "./createBrowserAdapter";

/** Browser adapter + unified GoPDF consumer facade (`engine.*()`). */
export async function createBrowserGopdf(): Promise<Gopdf> {
  return createEngine(await createBrowserAdapter());
}

export { createBrowserAdapter } from "./createBrowserAdapter";

export type { GopdfAdapter as BrowserGopdfAdapter };

/** @deprecated Use `createBrowserAdapter`. */
export { createBrowserAdapter as createBrowserRuntime } from "./createBrowserAdapter";
