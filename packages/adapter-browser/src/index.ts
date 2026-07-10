import type { GopdfAdapter } from "@gopdfjs/adapter/adapter";
import { createEngine } from "@gopdfjs/engine";
import { createBrowserCanvasPort } from "./canvas";
import { createBrowserEngine } from "./engine";
import { createBrowserPdfJsRuntime } from "./pdfjs";

/** Browser env adapter — WASM + pdf.js + canvas ports. */
export async function createBrowserAdapter(): Promise<GopdfAdapter> {
  const [engine, pdfjs, canvas] = await Promise.all([
    createBrowserEngine(),
    createBrowserPdfJsRuntime(),
    createBrowserCanvasPort(),
  ]);

  return { engine, pdfjs, canvas };
}

/** @deprecated Use `createBrowserAdapter`. */
export async function createBrowserRuntime(): Promise<GopdfAdapter> {
  return createBrowserAdapter();
}

/** Browser adapter + unified engine facade. */
export async function createBrowserGopdf() {
  return createEngine(await createBrowserAdapter());
}

export { createBrowserEngine } from "./engine";
export { createBrowserCanvasPort } from "./canvas";
export { createBrowserPdfJsRuntime } from "./pdfjs";
export { createEngine } from "@gopdfjs/engine";
