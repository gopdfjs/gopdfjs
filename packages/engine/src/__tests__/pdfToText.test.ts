import { describe, expect, it, vi } from "vitest";
import type { GopdfAdapter } from "@gopdfjs/adapter/gopdf";
import { pdfToText } from "../pdfToText";

function mockAdapter(items: Array<{ str?: string; transform?: number[] }>, numPages = 1): GopdfAdapter {
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
          getViewport: () => ({ width: 50, height: 50 }),
          render: () => ({ promise: Promise.resolve() }),
          getTextContent: async () => ({ items }),
        }),
      }),
      getOps: async () => ({}),
    },
    canvas: {
      create: async () => ({
        width: 50,
        height: 50,
        getContext2d: () => ({}) as CanvasRenderingContext2D,
        toImageBytes: async () => new Uint8Array([1, 2, 3]),
        dispose: async () => undefined,
      }),
    },
  };
}

describe("pdfToText", () => {
  it("groups text into lines (txt)", async () => {
    const adapter = mockAdapter([
      { str: "Hello", transform: [1, 0, 0, 1, 10, 100] },
      { str: "World", transform: [1, 0, 0, 1, 60, 100] },
      { str: "  ", transform: [1, 0, 0, 1, 0, 0] },
    ]);
    const text = await pdfToText(adapter, new Uint8Array(), { format: "txt" });
    expect(text).toContain("--- Page 1 ---");
    expect(text).toContain("Hello World");
  });

  it("skips items without text or transform", async () => {
    const adapter = mockAdapter([{ str: "ok", transform: [1, 0, 0, 1, 0, 50] }, { str: "x" }]);
    const text = await pdfToText(adapter, new Uint8Array());
    expect(text).toContain("ok");
    expect(text).not.toContain("\nx\n");
  });

  it("merges lines on nearby y", async () => {
    const adapter = mockAdapter([
      { str: "A", transform: [1, 0, 0, 1, 0, 50] },
      { str: "B", transform: [1, 0, 0, 1, 20, 52] },
    ]);
    const text = await pdfToText(adapter, new Uint8Array());
    expect(text).toMatch(/A B/);
  });

  it("emits html without images", async () => {
    const adapter = mockAdapter([{ str: "Hi", transform: [1, 0, 0, 1, 0, 10] }]);
    const html = await pdfToText(adapter, new Uint8Array(), { format: "html" });
    expect(html).toContain("<h1>Extracted PDF</h1>");
    expect(html).toContain("<pre>Hi</pre>");
    expect(html).not.toContain("<img");
  });

  it("emits html with embedded page images", async () => {
    const adapter = mockAdapter([{ str: "Hi", transform: [1, 0, 0, 1, 0, 10] }]);
    const html = await pdfToText(adapter, new Uint8Array(), {
      format: "html",
      includeImagesInHtml: true,
    });
    expect(html).toContain('data:image/jpeg;base64,');
    expect(html).toContain("<img");
  });

  it("base64-encodes page snapshots without Node Buffer", async () => {
    const originalBuffer = globalThis.Buffer;
    // @ts-expect-error — exercise browser btoa fallback in bytesToBase64
    delete globalThis.Buffer;
    try {
      const adapter = mockAdapter([{ str: "Hi", transform: [1, 0, 0, 1, 0, 10] }]);
      const html = await pdfToText(adapter, new Uint8Array(), {
        format: "html",
        includeImagesInHtml: true,
      });
      expect(html).toContain("data:image/jpeg;base64,AQID");
    } finally {
      globalThis.Buffer = originalBuffer;
    }
  });

  it("calls onProgress per page", async () => {
    const adapter = mockAdapter([], 2);
    const progress = vi.fn();
    await pdfToText(adapter, new Uint8Array(), {}, progress);
    expect(progress).toHaveBeenCalledWith(1, 2);
    expect(progress).toHaveBeenCalledWith(2, 2);
  });
});
