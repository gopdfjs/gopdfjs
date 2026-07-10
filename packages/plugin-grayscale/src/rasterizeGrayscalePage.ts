import type { GopdfRuntime, PdfPage } from "@gopdfjs/runtime";
import { GRAYSCALE_JPEG_QUALITY, GRAYSCALE_RENDER_SCALE } from "./constants";
import { canvasFilterForMode } from "./canvasFilter";
import type { GrayscaleMode, RasterizedGrayscalePage } from "./types";

/** Render one PDF page to grayscale JPEG using runtime canvas API. */
export async function rasterizeGrayscalePage(
  page: PdfPage,
  runtime: GopdfRuntime,
  mode: GrayscaleMode,
  scale = GRAYSCALE_RENDER_SCALE,
  jpegQuality = GRAYSCALE_JPEG_QUALITY,
  applyFilter = true,
): Promise<RasterizedGrayscalePage> {
  const baseViewport = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale });
  const surface = await runtime.createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const ctx = surface.getContext2d();

  if (applyFilter) {
    ctx.filter = canvasFilterForMode(mode);
  }

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
    const jpegBytes = await surface.toImageBytes("jpeg", jpegQuality);
    return {
      jpegBytes,
      widthPt: baseViewport.width,
      heightPt: baseViewport.height,
    };
  } finally {
    await surface.dispose();
  }
}
