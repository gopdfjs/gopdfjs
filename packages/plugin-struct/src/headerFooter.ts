import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return rgb(r, g, b);
}

export async function addHeaderFooter(
  bytes: Uint8Array,
  opts: { header: string; footer: string; fontSize: number; color: string; margin: number },
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const total = pages.length;
  const color = hexToRgb(opts.color);

  pages.forEach((page, i) => {
    const { width, height } = page.getSize();
    const resolve = (t: string) => t.replace("{page}", String(i + 1)).replace("{total}", String(total));

    if (opts.header) {
      const text = resolve(opts.header);
      const tw = font.widthOfTextAtSize(text, opts.fontSize);
      page.drawText(text, { x: (width - tw) / 2, y: height - opts.margin - opts.fontSize, size: opts.fontSize, font, color });
    }
    if (opts.footer) {
      const text = resolve(opts.footer);
      const tw = font.widthOfTextAtSize(text, opts.fontSize);
      page.drawText(text, { x: (width - tw) / 2, y: opts.margin, size: opts.fontSize, font, color });
    }
  });

  return doc.save();
}
