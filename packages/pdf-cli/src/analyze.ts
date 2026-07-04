import fs from "node:fs";
import path from "node:path";
import {
  PDFDocument,
  PDFDict,
  PDFName,
  PDFRawStream,
  PDFStream,
} from "pdf-lib";

export type AnalyzeReport = {
  fileName: string;
  sizeBytes: number;
  pageCount: number;
  fontCount: number;
  imageCount: number;
  formCount: number;
};

/** Load a PDF and return basic diagnostics (shared by CLI + tests). */
export async function analyzePdf(filePath: string): Promise<AnalyzeReport> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const bytes = fs.readFileSync(filePath);
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });

  let imageCount = 0;
  let formCount = 0;
  let fontCount = 0;

  for (const [, obj] of doc.context.enumerateIndirectObjects()) {
    let dict: PDFDict | undefined;

    if (obj instanceof PDFDict) {
      dict = obj;
    } else if (obj instanceof PDFStream || obj instanceof PDFRawStream) {
      dict = (obj as unknown as { dict: PDFDict }).dict;
    }

    if (!dict) {
      continue;
    }

    const type = dict.get(PDFName.of("Type"));
    const subtype = dict.get(PDFName.of("Subtype"));

    if (type === PDFName.of("Font")) {
      fontCount++;
    }
    if (subtype === PDFName.of("Image")) {
      imageCount++;
    } else if (subtype === PDFName.of("Form")) {
      formCount++;
    }
  }

  return {
    fileName: path.basename(filePath),
    sizeBytes: bytes.byteLength,
    pageCount: doc.getPageCount(),
    fontCount,
    imageCount,
    formCount,
  };
}

export function printAnalyzeReport(report: AnalyzeReport): void {
  const sizeMb = (report.sizeBytes / 1024 / 1024).toFixed(2);
  console.log(`\n=== PDF Diagnostic Report ===`);
  console.log(`File: ${report.fileName}`);
  console.log(
    `Size: ${sizeMb} MB (${report.sizeBytes.toLocaleString()} bytes)`,
  );
  console.log(`\n--- Basic Info ---`);
  console.log(`Pages: ${report.pageCount}`);
  console.log(`\n--- Internal Objects ---`);
  console.log(`Fonts: ${report.fontCount}`);
  console.log(`Form XObjects: ${report.formCount}`);
  console.log(`Image XObjects: ${report.imageCount}`);
  console.log(`\n=============================\n`);
}
