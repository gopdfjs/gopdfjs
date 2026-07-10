import { PDFDocument } from "pdf-lib";

export type NUpLayoutId = "1x2" | "2x1" | "2x2" | "2x3" | "4x4";
export type NUpSortOrder = "z-order" | "n-order";

export type NUpGrid = { cols: number; rows: number };

export const NUP_LAYOUTS: Record<NUpLayoutId, NUpGrid> = {
  "1x2": { cols: 1, rows: 2 },
  "2x1": { cols: 2, rows: 1 },
  "2x2": { cols: 2, rows: 2 },
  "2x3": { cols: 2, rows: 3 },
  "4x4": { cols: 4, rows: 4 },
};

export type NUpPdfOptions = {
  layout: NUpLayoutId;
  /** Row-major (Z) vs column-major (N) slot fill. Default z-order. */
  sortOrder?: NUpSortOrder;
  /** Gap between sub-pages in PDF points. Default 6. */
  margin?: number;
  /** Padding from sheet edge in PDF points. Default 12. */
  outerMargin?: number;
};

export type SheetRect = { x: number; y: number; width: number; height: number };

const DEFAULT_MARGIN = 6;
const DEFAULT_OUTER_MARGIN = 12;
const DEFAULT_SORT: NUpSortOrder = "z-order";

/** Pages tiled on one output sheet for a layout. */
export function pagesPerSheet(grid: NUpGrid): number {
  return grid.cols * grid.rows;
}

/** Map sequential slot index to grid column/row (row 0 = top). */
export function slotToGrid(
  slotIndex: number,
  grid: NUpGrid,
  sortOrder: NUpSortOrder,
): { col: number; row: number } {
  const { cols, rows } = grid;
  if (sortOrder === "n-order") {
    return {
      col: Math.floor(slotIndex / rows),
      row: slotIndex % rows,
    };
  }
  return {
    col: slotIndex % cols,
    row: Math.floor(slotIndex / cols),
  };
}

/** Cell rectangles in row-major grid order (index = row * cols + col). */
export function computeNUpCells(
  sheetWidth: number,
  sheetHeight: number,
  grid: NUpGrid,
  outerMargin: number,
  gap: number,
): SheetRect[] {
  const { cols, rows } = grid;
  const usableW = sheetWidth - 2 * outerMargin - (cols - 1) * gap;
  const usableH = sheetHeight - 2 * outerMargin - (rows - 1) * gap;
  const cellW = usableW / cols;
  const cellH = usableH / rows;
  const cells: SheetRect[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = outerMargin + col * (cellW + gap);
      const y = sheetHeight - outerMargin - (row + 1) * cellH - row * gap;
      cells.push({ x, y, width: cellW, height: cellH });
    }
  }
  return cells;
}

/** Scale source page to fit inside a cell, centered. */
export function computeDrawRect(
  cell: SheetRect,
  srcWidth: number,
  srcHeight: number,
): SheetRect {
  const scale = Math.min(cell.width / srcWidth, cell.height / srcHeight);
  const width = srcWidth * scale;
  const height = srcHeight * scale;
  return {
    x: cell.x + (cell.width - width) / 2,
    y: cell.y + (cell.height - height) / 2,
    width,
    height,
  };
}

/** Expected output page count after N-up tiling. */
export function computeNUpOutputPageCount(
  sourcePageCount: number,
  layout: NUpLayoutId,
): number {
  const perSheet = pagesPerSheet(NUP_LAYOUTS[layout]);
  return Math.ceil(sourcePageCount / perSheet);
}

/**
 * Tile multiple source pages onto each output sheet (N-up printing layout).
 * Output dimensions match the first page of each batch.
 */
export async function nUpPdf(
  bytes: Uint8Array,
  opts: NUpPdfOptions,
): Promise<Uint8Array> {
  const src = await PDFDocument.load(bytes);
  const out = await PDFDocument.create();
  const grid = NUP_LAYOUTS[opts.layout];
  const sortOrder = opts.sortOrder ?? DEFAULT_SORT;
  const gap = opts.margin ?? DEFAULT_MARGIN;
  const outerMargin = opts.outerMargin ?? DEFAULT_OUTER_MARGIN;
  const perSheet = pagesPerSheet(grid);
  const srcPages = src.getPages();
  const cells = (sheetW: number, sheetH: number) =>
    computeNUpCells(sheetW, sheetH, grid, outerMargin, gap);

  for (let batchStart = 0; batchStart < srcPages.length; batchStart += perSheet) {
    const batchEnd = Math.min(batchStart + perSheet, srcPages.length);
    const template = srcPages[batchStart];
    const { width: sheetW, height: sheetH } = template.getSize();
    const destPage = out.addPage([sheetW, sheetH]);
    const cellRects = cells(sheetW, sheetH);

    for (let slot = 0; slot < batchEnd - batchStart; slot++) {
      const srcPage = srcPages[batchStart + slot];
      const { col, row } = slotToGrid(slot, grid, sortOrder);
      const cell = cellRects[row * grid.cols + col];
      const { width: sw, height: sh } = srcPage.getSize();
      const draw = computeDrawRect(cell, sw, sh);
      const embedded = await out.embedPage(srcPage);
      destPage.drawPage(embedded, {
        x: draw.x,
        y: draw.y,
        width: draw.width,
        height: draw.height,
      });
    }
  }

  return out.save();
}
