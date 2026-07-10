import type { PdfDocument } from "@gopdfjs/runtime/document";
import type { PdfJsRuntime } from "@gopdfjs/adapter/render";

let pdfjsModule: typeof import("pdfjs-dist") | null = null;

async function loadPdfJs() {
  if (!pdfjsModule) {
    pdfjsModule = await import("pdfjs-dist");
    if (typeof globalThis !== "undefined" && !pdfjsModule.GlobalWorkerOptions.workerSrc) {
      pdfjsModule.GlobalWorkerOptions.workerSrc =
        `https://unpkg.com/pdfjs-dist@${pdfjsModule.version}/build/pdf.worker.min.mjs`;
    }
  }
  return pdfjsModule;
}

export async function createBrowserPdfJsRuntime(): Promise<PdfJsRuntime> {
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
