import type { GopdfAdapter } from "@gopdfjs/adapter/adapter";
import type { GopdfRuntime } from "@gopdfjs/runtime/runtime";

/**
 * Build the plugin-facing runtime from a host adapter bundle.
 * Lives in engine — runtime package only defines the `GopdfRuntime` interface.
 *
 * RFC 0058: engine owns adapter → runtime projection; plugins receive `runtime`, not `adapter`.
 */
export function createGopdfRuntime(adapter: GopdfAdapter): GopdfRuntime {
  return {
    loadDocument: (bytes) => adapter.pdfjs.loadDocument(bytes),
    getPdfOps: () => adapter.pdfjs.getOps(),
    createCanvas: (width, height) => adapter.canvas.create(width, height),
  };
}
