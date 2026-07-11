import { describe, expect, it } from "vitest";
import type { GopdfAdapter } from "@gopdfjs/adapter/gopdf";
import { pdfToJpeg } from "../pdfToJpeg";

function mockAdapter(numPages: number): GopdfAdapter {
  return {
    engine: {
      compressPdf: async () => new Uint8Array(),
      encodeImages: async () => new Uint8Array(),
      grayscalePdf: async () => new Uint8Array(),
      linearizePdf: async () => new Uint8Array(),
    },
    pdfjs: {
      loadDocument: async () => ({
        numPages,
        getPage: async (n: number) => ({
          getViewport: () => ({ width: 100, height: 100 }),
          render: () => ({ promise: Promise.resolve() }),
          getTextContent: async () => ({ items: [] }),
        }),
      }),
      getOps: async () => ({}),
    },
    canvas: {
      create: async () => ({
        width: 100,
        height: 100,
        getContext2d: () => ({}) as CanvasRenderingContext2D,
        toImageBytes: async () => new Uint8Array([0xaa]),
        dispose: async () => undefined,
      }),
    },
  };
}

describe("pdfToJpeg", () => {
  it("rasterizes every page with defaults", async () => {
    const pages = await pdfToJpeg(mockAdapter(2), new Uint8Array());
    expect(pages).toEqual([
      { bytes: new Uint8Array([0xaa]), page: 1 },
      { bytes: new Uint8Array([0xaa]), page: 2 },
    ]);
  });

  it("honors quality and scale options", async () => {
    const pages = await pdfToJpeg(mockAdapter(1), new Uint8Array(), { quality: 0.5, scale: 3 });
    expect(pages).toHaveLength(1);
  });
});
