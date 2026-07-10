import type { PdfDocument } from "@gopdfjs/model/document";
import type { PdfJsRuntime } from "@gopdfjs/adapter/render";

let pdfjsModule: typeof import("pdfjs-dist/legacy/build/pdf.mjs") | null = null;

async function loadPdfJs() {
  if (!pdfjsModule) {
    pdfjsModule = await import("pdfjs-dist/legacy/build/pdf.mjs");
  }
  return pdfjsModule;
}

export async function createNodePdfJsRuntime(): Promise<PdfJsRuntime> {
  const pdfjs = await loadPdfJs();
  let opsLoaded = false;

  return {
    async loadDocument(bytes) {
      const doc = await pdfjs.getDocument({ data: bytes }).promise;
      opsLoaded = true;
      return doc as unknown as PdfDocument;
    },
    async getOps() {
      if (!opsLoaded || !pdfjsModule) {
        throw new Error("Load a document before calling getOps()");
      }
      return pdfjsModule.OPS as Record<string, number>;
    },
  };
}
