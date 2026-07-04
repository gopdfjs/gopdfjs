import type { TextItem } from "pdfjs-dist/types/src/display/api";
import { pdfjs } from "@gopdfjs/render";
import { exportTables } from "./buildWorkbook";
import { detectTablesFromFragments } from "./detectTables";
import { textItemsToFragments } from "./extractFragments";
import type {
  AnalyzeProgress,
  DetectOptions,
  DetectedTable,
  ExportFormat,
  ExportOptions,
  PdfTableAnalysis,
  SheetMode,
  TextFragment,
} from "./types";

export type {
  DetectedTable,
  DetectOptions,
  ExportFormat,
  ExportOptions,
  PdfTableAnalysis,
  SheetMode,
  TextFragment,
};

/** Re-run detection from cached fragments (manual column boundary offsets). */
export function detectTablesFromPages(
  fragmentsByPage: TextFragment[][],
  options: DetectOptions = {},
): DetectedTable[] {
  const tables: DetectedTable[] = [];
  fragmentsByPage.forEach((fragments, pageIndex) => {
    tables.push(...detectTablesFromFragments(fragments, pageIndex, options));
  });
  return tables;
}

/** Extract positioned text and detect tables on every page. */
export async function analyzePdfTables(
  file: File,
  onProgress?: (progress: AnalyzeProgress) => void,
  options: DetectOptions = {},
): Promise<PdfTableAnalysis> {
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const fragmentsByPage: TextFragment[][] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    onProgress?.({ current: pageNum, total: pdf.numPages });
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent({ includeMarkedContent: false });
    const items = content.items.filter(
      (item): item is TextItem => "str" in item && item.str.trim().length > 0,
    );
    fragmentsByPage.push(textItemsToFragments(items));
  }

  const tables = detectTablesFromPages(fragmentsByPage, options);

  return { tables, pageCount: pdf.numPages, fragmentsByPage };
}

/** Analyze PDF tables and export to Excel or CSV. */
export async function pdfToExcel(
  file: File,
  exportOptions: ExportOptions,
  onProgress?: (progress: AnalyzeProgress) => void,
  detectOptions: DetectOptions = {},
): Promise<{ blob: Blob; analysis: PdfTableAnalysis }> {
  const analysis = await analyzePdfTables(file, onProgress, detectOptions);
  const blob = await exportTables(analysis.tables, exportOptions);
  return { blob, analysis };
}

export { exportTables, detectTablesFromFragments };
export { parseCellValue, mergeContinuationRows } from "./parseCellValue";
