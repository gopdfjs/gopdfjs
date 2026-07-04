import { PDFDocument, StandardFonts, rgb, type RGB } from "@cantoo/pdf-lib";

/** Mask-and-overlay edit applied in PDF user space. */
export interface NativeTextEdit {
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  text: string;
  color?: { r: number; g: number; b: number };
  bold?: boolean;
}

const MASK_PADDING_PT = 1;
const LINE_HEIGHT_FACTOR = 1.25;

function toRgb(color?: { r: number; g: number; b: number }): RGB {
  if (!color) return rgb(0, 0, 0);
  return rgb(color.r, color.g, color.b);
}

/** Draw white mask rectangles and replacement text runs. */
export async function applyNativeTextEdits(
  file: File,
  edits: NativeTextEdit[],
): Promise<Uint8Array> {
  const bytes = await file.arrayBuffer();
  const doc = await PDFDocument.load(bytes);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  for (const edit of edits) {
    const page = doc.getPage(edit.pageIndex);
    if (!page) continue;

    const lines = edit.text.split(/\r?\n/);
    const lineCount = Math.max(lines.length, 1);
    const maskHeight = Math.max(edit.height, edit.fontSize * LINE_HEIGHT_FACTOR * lineCount);

    page.drawRectangle({
      x: edit.x - MASK_PADDING_PT,
      y: edit.y - edit.fontSize * 0.25,
      width: edit.width + MASK_PADDING_PT * 2,
      height: maskHeight + MASK_PADDING_PT,
      color: rgb(1, 1, 1),
      borderWidth: 0,
    });

    const font = edit.bold ? bold : regular;
    const color = toRgb(edit.color);
    let baselineY = edit.y;

    for (const line of lines) {
      if (!line) {
        baselineY -= edit.fontSize * LINE_HEIGHT_FACTOR;
        continue;
      }
      page.drawText(line, {
        x: edit.x,
        y: baselineY,
        size: edit.fontSize,
        font,
        color,
      });
      baselineY -= edit.fontSize * LINE_HEIGHT_FACTOR;
    }
  }

  return doc.save();
}

/** Map extracted run geometry plus edited copy into a native edit payload. */
export function buildNativeTextEdit(
  run: {
    pageIndex: number;
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
  },
  text: string,
  style?: { fontSize?: number; color?: { r: number; g: number; b: number }; bold?: boolean },
): NativeTextEdit {
  return {
    pageIndex: run.pageIndex,
    x: run.x,
    y: run.y,
    width: run.width,
    height: run.height,
    fontSize: style?.fontSize ?? run.fontSize,
    text,
    color: style?.color,
    bold: style?.bold,
  };
}
