import type { Gopdf } from "@gopdfjs/engine";
import { createEngine } from "@gopdfjs/engine";
import { createBrowserAdapter } from "./createBrowserAdapter";

type EngineAdapter = Parameters<typeof createEngine>[0];

/** Browser adapter + unified GoPDF consumer facade (`engine.*()`). */
export async function createBrowserGopdf(): Promise<Gopdf> {
  return createEngine(await createBrowserAdapter());
}

export { createBrowserAdapter } from "./createBrowserAdapter";

export type { EngineAdapter as BrowserGopdfAdapter };

/** @deprecated Use `createBrowserAdapter`. */
export { createBrowserAdapter as createBrowserRuntime } from "./createBrowserAdapter";
