import { describe, expect, it, vi } from "vitest";
import type { GopdfAdapter } from "@gopdfjs/adapter/gopdf";
import { assertPdfBytesReadable, detachArrayBuffer } from "@gopdfjs/adapter/bytes";
import { createEngine } from "../createEngine";

const mockPage = {
  getViewport: () => ({ width: 100, height: 100 }),
  render: () => ({ promise: Promise.resolve() }),
  getTextContent: async () => ({ items: [{ str: "ok", transform: [1, 0, 0, 1, 0, 0] }] }),
};

/** Simulates pdf.js detaching the buffer passed to getDocument. */
function createDetachingPdfJs() {
  return {
    loadDocument: vi.fn(async (bytes: Uint8Array) => {
      detachArrayBuffer(bytes);
      return { numPages: 1, getPage: async () => mockPage };
    }),
    getOps: async () => ({}),
  };
}

function createMockAdapter(pdfjs = createDetachingPdfJs()): GopdfAdapter {
  return {
    engine: {
      compressPdf: async (bytes) => bytes,
      encodeImages: async () => new Uint8Array(),
      grayscalePdf: async (bytes) => bytes,
      linearizePdf: async (bytes) => bytes,
    },
    pdfjs,
    canvas: {
      create: async () => ({
        width: 1,
        height: 1,
        getContext2d: () => ({}) as CanvasRenderingContext2D,
        toImageBytes: async () => new Uint8Array([255]),
        dispose: async () => undefined,
      }),
    },
  };
}

describe("createEngine byte ownership", () => {
  it("pdfToText does not detach the host buffer", async () => {
    const host = new Uint8Array([37, 80, 68, 70, 45, 49, 46, 52]);
    const engine = createEngine(createMockAdapter());
    await engine.pdfToText(host, { format: "txt" });
    assertPdfBytesReadable(host);
  });

  it("sequential pdfToText + compress on same host buffer", async () => {
    const host = new Uint8Array([37, 80, 68, 70, 45, 49, 46, 52]);
    const engine = createEngine(createMockAdapter());

    await engine.pdfToText(host, { format: "txt" });
    assertPdfBytesReadable(host);

    await expect(engine.compressPdf(host, "recommended")).rejects.toThrow();
    assertPdfBytesReadable(host);
  });

  it("sequential feature calls reuse host buffer (pdfjs via runtime)", async () => {
    const host = new Uint8Array([37, 80, 68, 70, 45, 49, 46, 52]);
    const pdfjs = createDetachingPdfJs();
    const engine = createEngine(createMockAdapter(pdfjs));

    await engine.pdfToText(host, { format: "txt" });
    await expect(engine.compressPdf(host, "recommended")).rejects.toThrow();

    expect(pdfjs.loadDocument).toHaveBeenCalled();
    assertPdfBytesReadable(host);
  });
});
