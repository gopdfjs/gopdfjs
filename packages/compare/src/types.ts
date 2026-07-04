export type PdfRect = { x: number; y: number; width: number; height: number; pageIndex: number };

export type PositionedWord = {
    str: string;
    x: number;
    y: number;
    w: number;
    h: number;
    pageIndex: number;
    charOffset: number;
};

export type TextChangeItem = {
    pageIndex: number;
    kind: "delete" | "insert";
    text: string;
};

export type PagePairRender = {
    canvasA: HTMLCanvasElement | null;
    canvasB: HTMLCanvasElement | null;
    widthPx: number;
    heightPx: number;
    scale: number;
};

export type VisualDiffResult = {
    diffCanvas: HTMLCanvasElement;
    changedPixels: number;
};

export type TextDiffResult = {
    rectsA: PdfRect[];
    rectsB: PdfRect[];
    changes: TextChangeItem[];
    hasTextLayer: boolean;
};
