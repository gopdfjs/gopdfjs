import type { PDFPageProxy, RenderTask } from "pdfjs-dist";

export type PdfCanvasRender = {
  width: number;
  height: number;
  task: RenderTask;
};

/** Start rendering a PDF page using Node's canvas; caller owns awaiting `task.promise` and cancellation. */
export function startPdfPageRender(
  page: PDFPageProxy,
  canvas: any,
  scale: number
): PdfCanvasRender {
  const viewport = page.getViewport({ scale });
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  // In Node.js, we must supply standard rendering settings for canvas context
  const task = page.render({ canvasContext: ctx, viewport });
  return { width: viewport.width, height: viewport.height, task };
}

/** Render one PDF page into a 2D canvas at the given scale. */
export async function renderPdfToCanvas(
  page: PDFPageProxy,
  canvas: any,
  scale: number
): Promise<{ width: number; height: number }> {
  const { width, height, task } = startPdfPageRender(page, canvas, scale);
  await task.promise;
  return { width, height };
}
