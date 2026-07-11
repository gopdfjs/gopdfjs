import type { GopdfAdapter } from "@gopdfjs/adapter/adapter";
import type { Gopdf } from "@gopdfjs/engine";
import { createEngine } from "@gopdfjs/engine";
import { createNodeAdapter } from "./createNodeAdapter";

/** Node adapter + unified GoPDF consumer facade (`engine.*()`). */
export async function createNodeGopdf(): Promise<Gopdf> {
  return createEngine(await createNodeAdapter());
}

export { createNodeAdapter } from "./createNodeAdapter";

export type { GopdfAdapter as NodeGopdfAdapter };

/** @deprecated Use `createNodeAdapter`. */
export { createNodeAdapter as createNodeRuntime } from "./createNodeAdapter";
