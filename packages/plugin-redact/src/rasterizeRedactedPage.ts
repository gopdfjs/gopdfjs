import type { GopdfRuntime, PdfPage } from "@gopdfjs/runtime";
import { REDACT_RENDER_SCALE } from "./constants";
import type { RedactRegion } from "./types";

export type RasterizedPage = {
  pngBytes: Uint8Array;
  widthPt: number;
  heightPt: number;
};

/** Render page and burn black boxes — removes underlying text from output stream. */
export async function rasterizePageWithRedactions(
  page: PdfPage,
  runtime: GopdfRuntime,
  regions: RedactRegion[],
  scale = REDACT_RENDER_SCALE,
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

  ctx.fillStyle = "#000000";
  for (const r of regions) {
    const x = r.x * scale;
    const y = (heightPt - r.y - r.height) * scale;
    ctx.fillRect(x, y, r.width * scale, r.height * scale);
  }

  try {
    const pngBytes = await surface.toImageBytes("png");
    return { pngBytes, widthPt, heightPt };
  } finally {
    await surface.dispose();
  }
}
