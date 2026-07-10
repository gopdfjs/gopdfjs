import {
  DEFAULT_CELL_GAP,
  DEFAULT_X_TOLERANCE,
  DEFAULT_Y_TOLERANCE,
  MIN_TABLE_COLUMNS,
  MIN_TABLE_ROWS,
  TABLE_ID_SEP,
} from "./constants";
import type { DetectedTable, DetectOptions, TableRow, TextFragment } from "./types";

interface LineCell {
  x: number;
  text: string;
  right: number;
}

interface TextLine {
  y: number;
  cells: LineCell[];
}

function clusterAnchors(values: number[], tolerance: number): number[] {
  const sorted = [...values].sort((a, b) => a - b);
  const anchors: number[] = [];

  for (const v of sorted) {
    const last = anchors[anchors.length - 1];
    if (last === undefined || v - last > tolerance) {
      anchors.push(v);
    } else {
      anchors[anchors.length - 1] = (last + v) / 2;
    }
  }

  return anchors;
}

function applyAnchorOffsets(anchors: number[], offsets: number[] | undefined): number[] {
  if (!offsets?.length) return anchors;
  return anchors.map((a, i) => a + (offsets[i] ?? 0));
}

function nearestColumnIndex(x: number, anchors: number[]): number {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < anchors.length; i++) {
    const dist = Math.abs(x - anchors[i]);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
}

function groupFragmentsIntoLines(
  fragments: TextFragment[],
  yTolerance: number,
  cellGap: number,
): TextLine[] {
  const lines: TextLine[] = [];

  for (const frag of fragments) {
    const line = lines.find((l) => Math.abs(l.y - frag.y) <= yTolerance);
    if (line) {
      line.cells.push({ x: frag.x, text: frag.text, right: frag.x + frag.width });
      if (frag.y > line.y) line.y = frag.y;
    } else {
      lines.push({
        y: frag.y,
        cells: [{ x: frag.x, text: frag.text, right: frag.x + frag.width }],
      });
    }
  }

  for (const line of lines) {
    line.cells.sort((a, b) => a.x - b.x);
    const merged: LineCell[] = [];
    for (const cell of line.cells) {
      const prev = merged[merged.length - 1];
      if (prev && cell.x - prev.right <= cellGap) {
        prev.text = `${prev.text} ${cell.text}`.trim();
        prev.right = Math.max(prev.right, cell.right);
      } else {
        merged.push({ ...cell });
      }
    }
    line.cells = merged;
  }

  lines.sort((a, b) => b.y - a.y);
  return lines;
}

function findTableBlocks(lines: TextLine[], yTolerance: number): TextLine[][] {
  const blocks: TextLine[][] = [];
  let current: TextLine[] = [];

  for (const line of lines) {
    const isTabular = line.cells.length >= MIN_TABLE_COLUMNS;
    if (!isTabular) {
      if (current.length >= MIN_TABLE_ROWS) blocks.push(current);
      current = [];
      continue;
    }
    if (current.length > 0) {
      const gap = current[current.length - 1].y - line.y;
      if (gap > yTolerance * 6) {
        if (current.length >= MIN_TABLE_ROWS) blocks.push(current);
        current = [line];
        continue;
      }
    }
    current.push(line);
  }
  if (current.length >= MIN_TABLE_ROWS) blocks.push(current);
  return blocks;
}

function buildTableRows(block: TextLine[], anchors: number[]): TableRow[] {
  const colCount = anchors.length;
  return block.map((line) => {
    const cells = Array.from({ length: colCount }, () => "");
    for (const cell of line.cells) {
      const idx = nearestColumnIndex(cell.x, anchors);
      cells[idx] = cells[idx] ? `${cells[idx]} ${cell.text}`.trim() : cell.text;
    }
    return { y: line.y, cells };
  });
}

function tableBounds(block: TextLine[], anchors: number[]): DetectedTable["bounds"] {
  const xs = block.flatMap((l) => l.cells.map((c) => c.x));
  const rights = block.flatMap((l) => l.cells.map((c) => c.right));
  const ys = block.map((l) => l.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...rights, ...anchors);
  const maxY = Math.max(...ys);
  const minY = Math.min(...ys);
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/** Spatial table detection from positioned text fragments (no PDF borders required). */
export function detectTablesFromFragments(
  fragments: TextFragment[],
  pageIndex: number,
  options: DetectOptions = {},
): DetectedTable[] {
  const yTolerance = options.yTolerance ?? DEFAULT_Y_TOLERANCE;
  const cellGap = options.cellGap ?? DEFAULT_CELL_GAP;
  const xTolerance = options.xTolerance ?? DEFAULT_X_TOLERANCE;
  const lines = groupFragmentsIntoLines(fragments, yTolerance, cellGap);
  const blocks = findTableBlocks(lines, yTolerance);

  return blocks.map((block, tableIndex) => {
    const anchorSeeds = block.flatMap((line) => line.cells.map((c) => c.x));
    let anchors = clusterAnchors(anchorSeeds, xTolerance);
    anchors = applyAnchorOffsets(
      anchors,
      options.columnAnchorOffsets?.[`${pageIndex}${TABLE_ID_SEP}${tableIndex}`],
    );

    const rows = buildTableRows(block, anchors);
    return {
      id: `${pageIndex}${TABLE_ID_SEP}${tableIndex}`,
      pageIndex,
      tableIndex,
      rows,
      columnAnchors: anchors,
      bounds: tableBounds(block, anchors),
    };
  });
}

export { nearestColumnIndex, clusterAnchors, groupFragmentsIntoLines };
