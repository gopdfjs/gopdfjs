import { createEngine } from "@gopdfjs/engine";
import { createBrowserCanvasPort } from "./canvas";
import { createBrowserEngine } from "./engine";
import { createBrowserPdfJsRuntime } from "./pdfjs";

type EngineAdapter = Parameters<typeof createEngine>[0];

/** Browser env adapter — WASM + pdf.js + canvas ports (engine input only). */
export async function createBrowserAdapter(): Promise<EngineAdapter> {
  const [engine, pdfjs, canvas] = await Promise.all([
    createBrowserEngine(),
    createBrowserPdfJsRuntime(),
    createBrowserCanvasPort(),
  ]);

  return { engine, pdfjs, canvas };
}
