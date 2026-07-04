/** Slide aspect preset mapped to PptxGenJS layout. */
export type SlideLayout = "16x9" | "4x3";

/** How page content maps onto each slide. */
export type PptTemplate = "background-image" | "editable-only";

export interface SlideTextBox {
  text: string;
  /** Inches from slide top-left. */
  x: number;
  y: number;
  w: number;
  h: number;
  fontSize: number;
  bold?: boolean;
}

export interface SlidePageContent {
  pageIndex: number;
  pageWidthPt: number;
  pageHeightPt: number;
  backgroundDataUrl?: string;
  textBoxes: SlideTextBox[];
}

export interface PdfToPptOptions {
  /** Zero-based page indices to export as slides. */
  pageIndices: number[];
  slideLayout: SlideLayout;
  template: PptTemplate;
}

export interface PdfToPptProgress {
  current: number;
  total: number;
}
