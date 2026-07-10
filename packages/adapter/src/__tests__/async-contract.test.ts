import { describe, expect, it } from "vitest";
import type { GopdfRuntime } from "@gopdfjs/runtime/runtime";
import type { GopdfAdapter } from "../adapter";
import type { CanvasPort, PdfJsRuntime } from "../render";

/** Compile-time + runtime check: adapter ports and plugin runtime API are async. */
describe("@gopdfjs/adapter async contract", () => {
  it("GopdfRuntime exposes async plugin methods", async () => {
    const pdfjs: PdfJsRuntime = {
      loadDocument: async () => ({ numPages: 0, getPage: async () => notImplemented() }),
      getOps: async () => ({}),
    };
    const canvas: CanvasPort = {
      create: async () => ({
        width: 1,
        height: 1,
        getContext2d: () => ({}) as CanvasRenderingContext2D,
        toImageBytes: async () => new Uint8Array(),
        dispose: async () => {},
      }),
    };

    const adapter: GopdfAdapter = {
      engine: {
        compressPdf: async () => new Uint8Array(),
        encodeImages: async () => new Uint8Array(),
        grayscalePdf: async () => new Uint8Array(),
        linearizePdf: async () => new Uint8Array(),
      },
      pdfjs,
      canvas,
    };

    const runtime: GopdfRuntime = {
      loadDocument: (bytes) => adapter.pdfjs.loadDocument(bytes),
      getPdfOps: () => adapter.pdfjs.getOps(),
      createCanvas: (w, h) => adapter.canvas.create(w, h),
    };

    await expect(runtime.loadDocument(new Uint8Array())).resolves.toMatchObject({ numPages: 0 });
    await expect(runtime.getPdfOps()).resolves.toEqual({});
    const surface = await runtime.createCanvas(10, 10);
    await expect(surface.toImageBytes("png")).resolves.toBeInstanceOf(Uint8Array);
  });
});

function notImplemented(): never {
  throw new Error("not implemented");
}
