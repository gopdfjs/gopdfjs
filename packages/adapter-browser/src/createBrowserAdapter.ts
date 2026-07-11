import type { GopdfAdapter } from "@gopdfjs/adapter/adapter";
import { createBrowserCanvasPort } from "./canvas";
import { createBrowserEngine } from "./engine";
import { createBrowserPdfJsRuntime } from "./pdfjs";

/** Browser env adapter — WASM + pdf.js + canvas ports (engine input only). */
export async function createBrowserAdapter(): Promise<GopdfAdapter> {
  const [engine, pdfjs, canvas] = await Promise.all([
    createBrowserEngine(),
    createBrowserPdfJsRuntime(),
    createBrowserCanvasPort(),
  ]);

  return { engine, pdfjs, canvas };
}
