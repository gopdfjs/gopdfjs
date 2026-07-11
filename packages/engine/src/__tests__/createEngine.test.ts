import { describe, it, expect, vi, beforeEach } from "vitest";
import type { GopdfAdapter } from "@gopdfjs/adapter/gopdf";
import { createEngine } from "../createEngine";

vi.mock("@gopdfjs/plugin-shrink", () => ({
  compressPdf: vi.fn(async () => new Uint8Array([9])),
}));

vi.mock("@gopdfjs/plugin-grayscale", () => ({
  grayscalePdf: vi.fn(async () => ({
    bytes: new Uint8Array([2]),
    inputPages: 1,
    outputPages: 1,
    inputBytes: 10,
    outputBytes: 8,
  })),
}));

import { compressPdf as shrinkCompress } from "@gopdfjs/plugin-shrink";
import { grayscalePdf as grayscaleImpl } from "@gopdfjs/plugin-grayscale";

function mockAdapter(): GopdfAdapter {
  return {
    engine: {
      compressPdf: async () => new Uint8Array([1]),
      encodeImages: async () => new Uint8Array(),
      grayscalePdf: async () => new Uint8Array([2]),
      linearizePdf: async () => new Uint8Array([3]),
    },
    pdfjs: {
      loadDocument: async () => ({
        numPages: 1,
        getPage: async () => ({
          getViewport: ({ scale }: { scale: number }) => ({ width: 10 * scale, height: 10 * scale }),
          render: () => ({ promise: Promise.resolve() }),
          getTextContent: async () => ({ items: [{ str: "hello", transform: [1, 0, 0, 1, 0, 0] }] }),
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
    ocr: {
      recognize: async () => "text",
    },
  };
}

describe("createEngine", () => {
  beforeEach(() => {
    vi.mocked(shrinkCompress).mockClear();
    vi.mocked(grayscaleImpl).mockClear();
  });

  it("routes compressPdf through @gopdfjs/plugin-shrink", async () => {
    const engine = createEngine(mockAdapter());
    await expect(engine.compressPdf(new Uint8Array(), "recommended")).resolves.toEqual(
      new Uint8Array([9]),
    );
    expect(shrinkCompress).toHaveBeenCalled();
  });

  it("routes grayscalePdf through @gopdfjs/plugin-grayscale", async () => {
    const engine = createEngine(mockAdapter());
    const result = await engine.grayscalePdf(new Uint8Array(), { mode: "grayscale" });
    expect(result.bytes).toEqual(new Uint8Array([2]));
    expect(grayscaleImpl).toHaveBeenCalled();
  });

  it("passes linearizePdf to wasm", async () => {
    const engine = createEngine(mockAdapter());
    await expect(engine.linearizePdf(new Uint8Array())).resolves.toEqual(new Uint8Array([3]));
  });

  it("routes pdfToJpeg through adapter pdfjs + canvas", async () => {
    const engine = createEngine(mockAdapter());
    const pages = await engine.pdfToJpeg(new Uint8Array([37, 80, 68, 70]));
    expect(pages).toEqual([{ bytes: new Uint8Array([255]), page: 1 }]);
  });

  it("routes pdfToText through adapter pdfjs", async () => {
    const engine = createEngine(mockAdapter());
    const text = await engine.pdfToText(new Uint8Array(), { format: "txt" });
    expect(text).toContain("hello");
  });

  it("routes ocr through adapter.ocr", async () => {
    const engine = createEngine(mockAdapter());
    await expect(engine.ocr(new Uint8Array())).resolves.toBe("text");
  });

  it.each([
    ["low", "low"],
    ["recommended", "med"],
    ["extreme", "high"],
  ] as const)("maps CompressionLevel %s → plugin %s", async (level, expected) => {
    const engine = createEngine(mockAdapter());
    await engine.compressPdf(new Uint8Array(), level);
    expect(shrinkCompress).toHaveBeenCalledWith(
      expect.any(Uint8Array),
      expect.anything(),
      expected,
      expect.any(Function),
    );
  });

  it("forwards compress onProgress as fraction", async () => {
    vi.mocked(shrinkCompress).mockImplementationOnce(
      async (_b, _r, _l, onProgress) => {
        onProgress?.(50, "step");
        return new Uint8Array([9]);
      },
    );
    const engine = createEngine(mockAdapter());
    const progress = vi.fn();
    await engine.compressPdf(new Uint8Array(), "recommended", progress);
    expect(progress).toHaveBeenCalledWith(0.5);
  });
});
