import type { CanvasSurface } from "@gopdfjs/runtime/document";
import type { CanvasPort } from "@gopdfjs/adapter/render";

class BrowserCanvasSurface implements CanvasSurface {
  constructor(
    private readonly canvas: HTMLCanvasElement,
    readonly width: number,
    readonly height: number,
  ) {}

  getContext2d(): CanvasRenderingContext2D {
    const ctx = this.canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas 2D context unavailable");
    }
    return ctx;
  }

  async toImageBytes(format: "jpeg" | "png", quality = 0.85): Promise<Uint8Array> {
    const mime = format === "jpeg" ? "image/jpeg" : "image/png";
    const blob = await new Promise<Blob>((resolve, reject) => {
      this.canvas.toBlob(
        (value) => (value ? resolve(value) : reject(new Error("Canvas toBlob failed"))),
        mime,
        quality,
      );
    });
    return new Uint8Array(await blob.arrayBuffer());
  }

  async dispose(): Promise<void> {
    this.canvas.width = 0;
    this.canvas.height = 0;
  }

  getRenderTarget(): HTMLCanvasElement {
    return this.canvas;
  }
}

export async function createBrowserCanvasPort(): Promise<CanvasPort> {
  if (typeof document === "undefined") {
    throw new Error("Browser adapter requires DOM document");
  }

  return {
    async create(width, height) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      return new BrowserCanvasSurface(canvas, width, height);
    },
  };
}
