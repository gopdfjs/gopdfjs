import type { GopdfAdapter } from "@gopdfjs/adapter/adapter";
import { createNodeCanvasPort } from "./canvas";
import { createNodeEngine } from "./engine";
import { createNodeOcrPort } from "./ocr";
import { createNodePdfJsRuntime } from "./pdfjs";

/** Node env adapter — WASM + pdf.js + canvas + OCR ports (engine input only). */
export async function createNodeAdapter(): Promise<GopdfAdapter> {
  const [engine, pdfjs, canvas, ocr] = await Promise.all([
    createNodeEngine(),
    createNodePdfJsRuntime(),
    createNodeCanvasPort(),
    createNodeOcrPort(),
  ]);

  return { engine, pdfjs, canvas, ocr };
}
