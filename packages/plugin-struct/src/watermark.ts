import { PDFDocument, degrees, rgb, type PDFImage } from "pdf-lib";

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return rgb(r, g, b);
}

export type WatermarkPosition =
  | "top-left" | "top-center" | "top-right"
  | "center-left" | "center" | "center-right"
  | "bottom-left" | "bottom-center" | "bottom-right";

export type WatermarkImage = { bytes: Uint8Array; mimeType: string };

export async function watermarkPdf(
  bytes: Uint8Array,
  content: { text?: string; image?: WatermarkImage },
  opts: { fontSize: number; opacity: number; rotation: number; color: string; tile: boolean; position: WatermarkPosition },
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes);
  const pages = doc.getPages();
  const color = hexToRgb(opts.color);

  let embeddedImage: PDFImage | null = null;
  if (content.image) {
    const imgBytes = content.image.bytes;
    embeddedImage =
      content.image.mimeType === "image/png"
        ? await doc.embedPng(imgBytes)
        : await doc.embedJpg(imgBytes);
  }

  for (const page of pages) {
    const { width, height } = page.getSize();
    
    const draw = (x: number, y: number) => {
      if (embeddedImage) {
        const dims = embeddedImage.scale(opts.fontSize / 100);
        page.drawImage(embeddedImage, {
          x, y,
          width: dims.width,
          height: dims.height,
          opacity: opts.opacity,
          rotate: degrees(opts.rotation),
        });
      } else if (content.text) {
        page.drawText(content.text, {
          x, y,
          size: opts.fontSize,
          color,
          opacity: opts.opacity,
          rotate: degrees(opts.rotation),
        });
      }
    };

    if (opts.tile) {
      const step = opts.fontSize * 6;
      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) draw(x, y);
      }
    } else {
      let x = 0, y = 0;
      const margin = 50;
      if (opts.position.includes("top")) y = height - margin - opts.fontSize;
      else if (opts.position.includes("bottom")) y = margin;
      else y = height / 2;

      if (opts.position.includes("left")) x = margin;
      else if (opts.position.includes("right")) x = width - margin - (content.text ? content.text.length * opts.fontSize * 0.5 : opts.fontSize);
      else x = width / 2 - (content.text ? content.text.length * opts.fontSize * 0.25 : opts.fontSize / 2);

      draw(x, y);
    }
  }
  return doc.save();
}
