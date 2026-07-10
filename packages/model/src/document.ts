/** Minimal pdf.js page surface (version-agnostic). */
export type PdfViewport = { width: number; height: number };

export type PdfPage = {
  getViewport: (params: { scale: number }) => PdfViewport;
  render: (params: {
    canvasContext: CanvasRenderingContext2D;
    viewport: PdfViewport;
  }) => { promise: Promise<void> };
  getTextContent: (params: {
    includeMarkedContent: boolean;
  }) => Promise<{ items: PdfTextContentItem[] }>;
};

export type PdfDocument = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPage>;
};

export type PdfTextContentItem = {
  str?: string;
  transform?: number[];
  width?: number;
};

/**
 * 2D surface for pdf.js `page.render`.
 * `getContext2d` stays sync — pdf.js requires a context immediately after alloc.
 */
export interface CanvasSurface {
  readonly width: number;
  readonly height: number;
  getContext2d(): CanvasRenderingContext2D;
  toImageBytes(
    format: "jpeg" | "png",
    quality?: number,
  ): Promise<Uint8Array>;
  dispose(): Promise<void>;
  getRenderTarget?(): unknown;
}
