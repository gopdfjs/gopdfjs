import { createEngine } from "@gopdfjs/engine";
import { createNodeCanvasPort } from "./canvas";
import { createNodeEngine } from "./engine";
import { createNodeOcrPort } from "./ocr";
import { createNodePdfJsRuntime } from "./pdfjs";

type EngineAdapter = Parameters<typeof createEngine>[0];

/** Node env adapter — WASM + pdf.js + canvas + OCR ports (engine input only). */
export async function createNodeAdapter(): Promise<EngineAdapter> {
  const [engine, pdfjs, canvas, ocr] = await Promise.all([
    createNodeEngine(),
    createNodePdfJsRuntime(),
    createNodeCanvasPort(),
    createNodeOcrPort(),
  ]);

  return { engine, pdfjs, canvas, ocr };
}
