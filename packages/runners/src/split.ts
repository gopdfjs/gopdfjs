import { PDFDocument } from "pdf-lib";
import { readFileAsArrayBuffer } from "./readFile";

export function parseRanges(input: string, total: number): number[][] {
  if (!input.trim()) return Array.from({ length: total }, (_, i) => [i]);
  return input.split(",").flatMap((part) => {
    const m = part.trim().match(/^(\d+)(?:-(\d+))?$/);
    if (!m) return [];
    const start = Math.max(1, parseInt(m[1])) - 1;
    const end = Math.min(total, parseInt(m[2] ?? m[1])) - 1;
    return [[...Array.from({ length: end - start + 1 }, (_, i) => start + i)]];
  });
}

export async function splitPdf(file: File, ranges: number[][]): Promise<Uint8Array[]> {
  const bytes = await readFileAsArrayBuffer(file);
  const src = await PDFDocument.load(bytes);
  const results: Uint8Array[] = [];
  for (const range of ranges) {
    const doc = await PDFDocument.create();
    const pages = await doc.copyPages(src, range);
    pages.forEach((p) => doc.addPage(p));
    results.push(await doc.save());
  }
  return results;
}
