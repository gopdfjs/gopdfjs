/** Minimal pdf.js page surface for plugins (version-agnostic). */
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
  /** Release native/canvas memory when done with a page. */
  dispose(): Promise<void>;
  /** pdf.js may require the backing canvas on browser runtimes. */
  getRenderTarget?(): unknown;
}
