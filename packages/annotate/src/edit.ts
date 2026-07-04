import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { readFileAsArrayBuffer } from "@gopdfjs/files";

export type Annotation = {
    id: string;
    type: "text" | "image" | "rect" | "ellipse" | "line";
    pageIndex: number;
    x: number; // PDF points from left
    y: number; // PDF points from bottom
    width?: number;
    height?: number;
    text?: string;
    image?: File;
    fontSize?: number;
    color: string; // hex
    strokeColor?: string;
    strokeWidth?: number;
};

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return rgb(r, g, b);
}

export async function applyEdits(file: File, annotations: Annotation[]): Promise<Uint8Array> {
  const bytes = await readFileAsArrayBuffer(file);
  const doc = await PDFDocument.load(bytes);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();

  for (const ann of annotations) {
    const page = pages[ann.pageIndex];
    if (!page) continue;

        if (ann.type === "image" && ann.image) {
            const imgBytes = await readFileAsArrayBuffer(ann.image);
            const embedded =
                ann.image.type === "image/png"
                    ? await doc.embedPng(imgBytes)
                    : await doc.embedJpg(imgBytes);

            const scale = (ann.fontSize || 100) / 100;
            const dims = embedded.scale(scale);
            page.drawImage(embedded, {
                x: ann.x,
                y: ann.y,
                width: ann.width || dims.width,
                height: ann.height || dims.height,
            });
        } else if (ann.type === "text" && ann.text) {
            page.drawText(ann.text, {
                x: ann.x,
                y: ann.y,
                size: ann.fontSize || 16,
                font,
                color: hexToRgb(ann.color),
            });
        } else if (ann.type === "rect") {
            page.drawRectangle({
                x: ann.x,
                y: ann.y,
                width: ann.width || 100,
                height: ann.height || 50,
                color: hexToRgb(ann.color),
                borderColor: ann.strokeColor ? hexToRgb(ann.strokeColor) : undefined,
                borderWidth: ann.strokeWidth,
            });
        } else if (ann.type === "ellipse") {
            page.drawEllipse({
                x: ann.x + (ann.width || 100) / 2,
                y: ann.y + (ann.height || 50) / 2,
                xScale: (ann.width || 100) / 2,
                yScale: (ann.height || 50) / 2,
                color: hexToRgb(ann.color),
                borderColor: ann.strokeColor ? hexToRgb(ann.strokeColor) : undefined,
                borderWidth: ann.strokeWidth,
            });
        } else if (ann.type === "line") {
            page.drawLine({
                start: { x: ann.x, y: ann.y },
                end: { x: ann.x + (ann.width || 100), y: ann.y + (ann.height || 0) },
                color: hexToRgb(ann.color),
                thickness: ann.strokeWidth || 2,
            });
        }
  }

  return doc.save();
}
