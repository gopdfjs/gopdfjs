import { createEngine } from "@gopdfjs/engine";
import { createNodeAdapter } from "./createNodeAdapter";

/** Node adapter + unified GoPDF consumer facade (`engine.*()`). */
export async function createNodeGopdf() {
  return createEngine(await createNodeAdapter());
}

export { createNodeAdapter } from "./createNodeAdapter";

/** @deprecated Use `createNodeAdapter`. */
export { createNodeAdapter as createNodeRuntime } from "./createNodeAdapter";
