import { createCanvas as napiCreateCanvas } from "@napi-rs/canvas";
import type { CanvasSurface } from "@gopdfjs/model/document";
import type { CanvasPort } from "@gopdfjs/adapter/render";

class NodeCanvasSurface implements CanvasSurface {
  constructor(
    private readonly canvas: ReturnType<typeof napiCreateCanvas>,
    readonly width: number,
    readonly height: number,
  ) {}

  getContext2d(): CanvasRenderingContext2D {
    const ctx = this.canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas 2D context unavailable");
    }
    return ctx as unknown as CanvasRenderingContext2D;
  }

  async toImageBytes(format: "jpeg" | "png", quality = 0.85): Promise<Uint8Array> {
    const buffer =
      format === "jpeg"
        ? await this.canvas.toBuffer("image/jpeg", Math.round(quality * 100))
        : await this.canvas.toBuffer("image/png");
    return new Uint8Array(buffer);
  }

  async dispose(): Promise<void> {
    this.canvas.width = 0;
    this.canvas.height = 0;
  }

  getRenderTarget(): ReturnType<typeof napiCreateCanvas> {
    return this.canvas;
  }
}

export async function createNodeCanvasPort(): Promise<CanvasPort> {
  return {
    async create(width, height) {
      const canvas = napiCreateCanvas(width, height);
      return new NodeCanvasSurface(canvas, width, height);
    },
  };
}
