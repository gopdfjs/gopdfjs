import { describe, expect, it, vi } from "vitest";
import type { GopdfAdapter } from "@gopdfjs/adapter/adapter";
import { createGopdfRuntime } from "../createGopdfRuntime";

function mockAdapter(): GopdfAdapter {
  return {
    engine: {
      compressPdf: async () => new Uint8Array(),
      encodeImages: async () => new Uint8Array(),
      grayscalePdf: async () => new Uint8Array(),
      linearizePdf: async () => new Uint8Array(),
    },
    pdfjs: {
      loadDocument: vi.fn(async () => ({ numPages: 2, getPage: async () => notImplemented() })),
      getOps: vi.fn(async () => ({ op: 1 })),
    },
    canvas: {
      create: vi.fn(async () => ({
        width: 4,
        height: 4,
        getContext2d: () => ({}) as CanvasRenderingContext2D,
        toImageBytes: async () => new Uint8Array(),
        dispose: async () => undefined,
      })),
    },
  };
}

describe("createGopdfRuntime", () => {
  it("projects adapter.pdfjs.loadDocument", async () => {
    const adapter = mockAdapter();
    const runtime = createGopdfRuntime(adapter);
    const bytes = new Uint8Array([37, 80, 68, 70]);
    await runtime.loadDocument(bytes);
    expect(adapter.pdfjs.loadDocument).toHaveBeenCalledWith(bytes);
  });

  it("projects adapter.pdfjs.getOps", async () => {
    const adapter = mockAdapter();
    const runtime = createGopdfRuntime(adapter);
    await expect(runtime.getPdfOps()).resolves.toEqual({ op: 1 });
  });

  it("projects adapter.canvas.create", async () => {
    const adapter = mockAdapter();
    const runtime = createGopdfRuntime(adapter);
    const surface = await runtime.createCanvas(12, 8);
    expect(adapter.canvas.create).toHaveBeenCalledWith(12, 8);
    await expect(surface.toImageBytes("png")).resolves.toBeInstanceOf(Uint8Array);
  });
});

function notImplemented(): never {
  throw new Error("not implemented");
}
