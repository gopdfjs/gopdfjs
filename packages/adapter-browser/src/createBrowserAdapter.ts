import type { GopdfAdapter } from "@gopdfjs/engine";
import { createBrowserCanvasPort } from "./canvas";
import { createBrowserEngine } from "./engine";
import { createBrowserOcrPort } from "./ocr";
import { createBrowserPdfJsRuntime } from "./pdfjs";

/** Browser env adapter — WASM + pdf.js + canvas + OCR ports (engine input only). */
export async function createBrowserAdapter(): Promise<GopdfAdapter> {
  const [engine, pdfjs, canvas, ocr] = await Promise.all([
    createBrowserEngine(),
    createBrowserPdfJsRuntime(),
    createBrowserCanvasPort(),
    createBrowserOcrPort(),
  ]);

  return { engine, pdfjs, canvas, ocr };
}
