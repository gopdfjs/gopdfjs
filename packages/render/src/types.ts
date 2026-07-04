/** Minimal pdf.js surface — version-agnostic structural types for tool packages. */
export type PdfPage = {
    getViewport: (params: { scale: number }) => { width: number; height: number };
    render: (params: {
        canvasContext: CanvasRenderingContext2D;
        viewport: ReturnType<PdfPage["getViewport"]>;
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
