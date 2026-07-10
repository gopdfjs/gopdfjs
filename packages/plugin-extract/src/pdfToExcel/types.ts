/** One text run from pdf.js with PDF point-space coordinates. */
export interface TextFragment {
  text: string;
  x: number;
  y: number;
  width: number;
}

/** Detected table row — cell strings align to column anchors. */
export interface TableRow {
  y: number;
  cells: string[];
}

/** Bounding box + grid for one table on a page (PDF point space). */
export interface DetectedTable {
  id: string;
  pageIndex: number;
  tableIndex: number;
  rows: TableRow[];
  columnAnchors: number[];
  bounds: { x: number; y: number; width: number; height: number };
}

export type ExportFormat = "xlsx" | "csv";
export type SheetMode = "single" | "per-page";

export interface DetectOptions {
  /** Max vertical delta (pt) to group fragments on one line. */
  yTolerance?: number;
  /** Min horizontal gap (pt) between cells on a line. */
  cellGap?: number;
  /** Column anchor clustering tolerance (pt). */
  xTolerance?: number;
  /** Per-anchor nudge after detection (pt), keyed by table id. */
  columnAnchorOffsets?: Record<string, number[]>;
}

export interface PdfTableAnalysis {
  tables: DetectedTable[];
  pageCount: number;
  fragmentsByPage: TextFragment[][];
}

export interface ExportOptions {
  format: ExportFormat;
  sheetMode: SheetMode;
  /** When set, only these table ids are exported. */
  includedTableIds?: string[];
}

export interface AnalyzeProgress {
  current: number;
  total: number;
}
