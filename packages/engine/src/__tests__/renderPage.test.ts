import { describe, expect, it, vi } from "vitest";
import type { CanvasPort, PdfPage } from "@gopdfjs/model/document";
import { renderPageToJpeg, renderPageToPng } from "../renderPage";

function mockPage(renderTarget?: unknown): PdfPage {
  return {
    getViewport: () => ({ width: 10.4, height: 20.6 }),
    render: vi.fn(() => ({ promise: Promise.resolve() })),
    getTextContent: async () => ({ items: [] }),
  };
}

function mockCanvas(getRenderTarget?: () => unknown): CanvasPort {
  const dispose = vi.fn(async () => undefined);
  const toImageBytes = vi.fn(async (format: "jpeg" | "png") =>
    Uint8Array.from([format === "jpeg" ? 0xff : 0x89]),
  );
  return {
    create: vi.fn(async () => ({
      width: 11,
      height: 21,
      getContext2d: () => ({}) as CanvasRenderingContext2D,
      toImageBytes,
      dispose,
      getRenderTarget,
    })),
  };
}

describe("renderPageToJpeg", () => {
  it("renders via canvas port and returns jpeg bytes", async () => {
    const canvas = mockCanvas();
    const page = mockPage();
    const bytes = await renderPageToJpeg(page, canvas, 2, 0.9);
    expect(canvas.create).toHaveBeenCalledWith(11, 21);
    expect(page.render).toHaveBeenCalled();
    expect(bytes).toEqual(new Uint8Array([0xff]));
  });

  it("passes getRenderTarget to pdf.js when present", async () => {
    const target = { kind: "canvas" };
    const canvas = mockCanvas(() => target);
    const page = mockPage();
    await renderPageToJpeg(page, canvas, 1, 0.85);
    expect(page.render).toHaveBeenCalledWith(
      expect.objectContaining({ canvas: target }),
    );
  });

  it("disposes surface after encode", async () => {
    const dispose = vi.fn(async () => undefined);
    const canvas: CanvasPort = {
      create: async () => ({
        width: 1,
        height: 1,
        getContext2d: () => ({}) as CanvasRenderingContext2D,
        toImageBytes: async () => new Uint8Array([1]),
        dispose,
      }),
    };
    await renderPageToJpeg(mockPage(), canvas, 1, 0.8);
    expect(dispose).toHaveBeenCalled();
  });
});

describe("renderPageToPng", () => {
  it("renders and returns png bytes", async () => {
    const canvas = mockCanvas();
    const bytes = await renderPageToPng(mockPage(), canvas, 1.5);
    expect(bytes).toEqual(new Uint8Array([0x89]));
  });
});
