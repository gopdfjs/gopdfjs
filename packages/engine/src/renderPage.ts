import type { PdfPage, PdfViewport } from "@gopdfjs/runtime/document";
import type { CanvasPort } from "@gopdfjs/adapter/render";

type RenderParams = {
  canvasContext: CanvasRenderingContext2D;
  viewport: PdfViewport;
  canvas?: unknown;
};

async function renderPageToSurface(
  page: PdfPage,
  canvas: CanvasPort,
  scale: number,
): Promise<{ surface: Awaited<ReturnType<CanvasPort["create"]>>; viewport: PdfViewport }> {
  const viewport = page.getViewport({ scale });
  const surface = await canvas.create(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const ctx = surface.getContext2d();
  const renderParams: RenderParams = { canvasContext: ctx, viewport };
  const target = surface.getRenderTarget?.();
  if (target !== undefined) {
    renderParams.canvas = target;
  }
  await page.render(renderParams).promise;
  return { surface, viewport };
}

/** Render one pdf.js page to JPEG bytes via injected canvas port. */
export async function renderPageToJpeg(
  page: PdfPage,
  canvas: CanvasPort,
  scale: number,
  quality: number,
): Promise<Uint8Array> {
  const { surface } = await renderPageToSurface(page, canvas, scale);
  try {
    return await surface.toImageBytes("jpeg", quality);
  } finally {
    await surface.dispose();
  }
}

/** Render one pdf.js page to PNG bytes via injected canvas port. */
export async function renderPageToPng(
  page: PdfPage,
  canvas: CanvasPort,
  scale: number,
): Promise<Uint8Array> {
  const { surface } = await renderPageToSurface(page, canvas, scale);
  try {
    return await surface.toImageBytes("png");
  } finally {
    await surface.dispose();
  }
}
