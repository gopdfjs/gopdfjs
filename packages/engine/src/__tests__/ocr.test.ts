import { describe, expect, it, vi } from "vitest";
import type { GopdfAdapter } from "@gopdfjs/adapter/gopdf";
import { ocrPdf } from "../ocr";

function mockAdapter(numPages: number, withOcr = true): GopdfAdapter {
  const recognize = vi.fn(async (_bytes: Uint8Array, _lang: string, onProgress?: (f: number) => void) => {
    onProgress?.(0.5);
    return "line";
  });
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
        getPage: async () => ({
          getViewport: () => ({ width: 10, height: 10 }),
          render: () => ({ promise: Promise.resolve() }),
          getTextContent: async () => ({ items: [] }),
        }),
      }),
      getOps: async () => ({}),
    },
    canvas: {
      create: async () => ({
        width: 10,
        height: 10,
        getContext2d: () => ({}) as CanvasRenderingContext2D,
        toImageBytes: async () => new Uint8Array([255]),
        dispose: async () => undefined,
      }),
    },
    ocr: withOcr ? { recognize } : undefined,
  };
}

describe("ocrPdf", () => {
  it("throws when adapter.ocr is missing", async () => {
    await expect(ocrPdf(mockAdapter(1, false), new Uint8Array())).rejects.toThrow(/adapter-node/);
  });

  it("OCRs each page and joins text", async () => {
    const adapter = mockAdapter(2);
    const text = await ocrPdf(adapter, new Uint8Array(), "eng");
    expect(text).toBe("line\n\nline");
    expect(adapter.ocr?.recognize).toHaveBeenCalledTimes(2);
  });

  it("reports page progress", async () => {
    const adapter = mockAdapter(2);
    const progress: number[] = [];
    await ocrPdf(adapter, new Uint8Array(), "eng", (f) => progress.push(f));
    expect(progress.length).toBeGreaterThan(0);
    expect(progress[progress.length - 1]).toBe(1);
  });
});
