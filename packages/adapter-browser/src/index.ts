import { createEngine } from "@gopdfjs/engine";
import { createBrowserAdapter } from "./createBrowserAdapter";

/** Browser adapter + unified GoPDF consumer facade (`engine.*()`). */
export async function createBrowserGopdf() {
  return createEngine(await createBrowserAdapter());
}

export { createBrowserAdapter } from "./createBrowserAdapter";

/** @deprecated Use `createBrowserAdapter`. */
export { createBrowserAdapter as createBrowserRuntime } from "./createBrowserAdapter";
