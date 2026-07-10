import type { GopdfAdapter } from "@gopdfjs/adapter/adapter";
import type { GopdfRuntime } from "@gopdfjs/runtime/runtime";

/** Project adapter ports into the plugin-facing runtime API (RFC 0058 §2.3.3). */
export function createGopdfRuntime(adapter: GopdfAdapter): GopdfRuntime {
  return {
    loadDocument: (bytes) => adapter.pdfjs.loadDocument(bytes),
    getPdfOps: () => adapter.pdfjs.getOps(),
    createCanvas: (width, height) => adapter.canvas.create(width, height),
  };
}
