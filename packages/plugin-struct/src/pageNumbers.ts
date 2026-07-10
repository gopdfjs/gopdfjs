import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
export type PageNumberPosition =
  | "top-left" | "top-center" | "top-right"
  | "bottom-left" | "bottom-center" | "bottom-right";

export async function addPageNumbers(
  bytes: Uint8Array,
  opts: { position: PageNumberPosition; startNumber: number; fontSize: number; prefix: string; suffix: string; color?: string },
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const pages = doc.getPages();
  const margin = 30;

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return rgb(r, g, b);
  };

  const color = opts.color ? hexToRgb(opts.color) : rgb(0, 0, 0);

  pages.forEach((page, i) => {
    const { width, height } = page.getSize();
    const num = i + opts.startNumber;
    const text = `${opts.prefix}${num}${opts.suffix}`;
    const textWidth = font.widthOfTextAtSize(text, opts.fontSize);
    let x: number, y: number;

    // Y Position
    if (opts.position.startsWith("top")) {
      y = height - margin - opts.fontSize;
    } else {
      y = margin;
    }

    // X Position
    if (opts.position.endsWith("left")) {
      x = margin;
    } else if (opts.position.endsWith("right")) {
      x = width - margin - textWidth;
    } else {
      x = (width - textWidth) / 2;
    }

    page.drawText(text, { x, y, size: opts.fontSize, font, color });
  });

  return doc.save();
}
