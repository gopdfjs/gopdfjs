import type { GopdfRuntime, PdfPage } from "@gopdfjs/runtime";
import { REPAIR_RENDER_SCALE } from "./constants";

export type RasterizedPage = {
  pngBytes: Uint8Array;
  widthPt: number;
  heightPt: number;
};

/** Render one page to PNG for visual rebuild fallback. */
export async function rasterizePage(
  page: PdfPage,
  runtime: GopdfRuntime,
  scale = REPAIR_RENDER_SCALE,
): Promise<RasterizedPage> {
  const baseViewport = page.getViewport({ scale: 1 });
  const widthPt = baseViewport.width;
  const heightPt = baseViewport.height;
  const viewport = page.getViewport({ scale });
  const surface = await runtime.createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const ctx = surface.getContext2d();
  const renderParams: {
    canvasContext: CanvasRenderingContext2D;
    viewport: typeof viewport;
    canvas?: unknown;
  } = { canvasContext: ctx, viewport };
  const target = surface.getRenderTarget?.();
  if (target !== undefined) {
    renderParams.canvas = target;
  }
  await page.render(renderParams).promise;

  try {
    const pngBytes = await surface.toImageBytes("png");
    return { pngBytes, widthPt, heightPt };
  } finally {
    await surface.dispose();
  }
}
