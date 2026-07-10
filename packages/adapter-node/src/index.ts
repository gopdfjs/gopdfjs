import type { GopdfAdapter } from "@gopdfjs/adapter/adapter";
import { createEngine } from "@gopdfjs/engine";
import { createNodeCanvasPort } from "./canvas";
import { createNodeEngine } from "./engine";
import { createNodeOcrPort } from "./ocr";
import { createNodePdfJsRuntime } from "./pdfjs";

/** Node env adapter — WASM + pdf.js + canvas + OCR ports. */
export async function createNodeAdapter(): Promise<GopdfAdapter> {
  const [engine, pdfjs, canvas, ocr] = await Promise.all([
    createNodeEngine(),
    createNodePdfJsRuntime(),
    createNodeCanvasPort(),
    createNodeOcrPort(),
  ]);

  return { engine, pdfjs, canvas, ocr };
}

/** @deprecated Use `createNodeAdapter`. */
export async function createNodeRuntime(): Promise<GopdfAdapter> {
  return createNodeAdapter();
}

/** Node adapter + unified engine facade. */
export async function createNodeGopdf() {
  return createEngine(await createNodeAdapter());
}

export { createNodeEngine } from "./engine";
export { createNodeCanvasPort } from "./canvas";
export { createNodePdfJsRuntime } from "./pdfjs";
export { createNodeOcrPort } from "./ocr";
export { createEngine } from "@gopdfjs/engine";
