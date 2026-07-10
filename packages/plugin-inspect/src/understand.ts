import { PDFDocument, PDFName, PDFDict, PDFStream, PDFRawStream } from "pdf-lib";
import type { GopdfRuntime } from "@gopdfjs/runtime";

export interface PdfAnalysisMeta {
  fileName?: string;
  fileSizeBytes?: number;
}

export interface PdfAnalysisResult {
  fileName: string;
  fileSizeStr: string;
  pages: number;
  title: string;
  author: string;
  creator: string;
  producer: string;
  creationDate: string;
  modDate: string;
  isEncrypted: boolean;
  version: string;
  isLinearized: boolean;
  fontCount: number;
  imageCount: number;
  formCount: number;
  imageRawSizeMb: string;
  pageDetails: { width: number; height: number; label: string }[];
  fonts: string[];
  permissions: {
    printing: "allowed" | "not-allowed";
    modifying: "allowed" | "not-allowed";
    copying: "allowed" | "not-allowed";
    annotating: "allowed" | "not-allowed";
  };
}

interface PDFJsPage {
  getViewport: (opts: { scale: number }) => { width: number; height: number };
  getOperatorList: () => Promise<{ fnArray: number[]; argsArray: unknown[][] }>;
  commonObjs: { get: (id: string) => Promise<{ name?: string }> };
}

interface PDFJsDocument {
  numPages: number;
  getPage: (i: number) => Promise<PDFJsPage>;
  isLinearized?: boolean;
  _transport?: { pdfjsVersion: string };
}

function formatFileSize(bytes: number): string {
  const sizeMb = (bytes / 1024 / 1024).toFixed(2);
  return `${sizeMb} MB (${bytes.toLocaleString()} bytes)`;
}

export async function analyzePdf(
  bytes: Uint8Array,
  runtime: GopdfRuntime,
  meta: PdfAnalysisMeta = {},
): Promise<PdfAnalysisResult> {
  const fileName = meta.fileName ?? "document.pdf";
  const fileSize = meta.fileSizeBytes ?? bytes.byteLength;
  const fileSizeStr = formatFileSize(fileSize);

  let pdfLibDoc: PDFDocument;
  let isEncrypted = false;

  try {
    pdfLibDoc = await PDFDocument.load(bytes, { updateMetadata: false });
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("encrypted")) {
      isEncrypted = true;
      return getFallbackResult(fileName, fileSizeStr, true);
    }
    throw e;
  }

  const pdfjsDoc = (await runtime.loadDocument(bytes)) as unknown as PDFJsDocument;
  const OPS = await runtime.getPdfOps();

  const pageDetails: { width: number; height: number; label: string }[] = [];
  const fontsSet = new Set<string>();

  for (let i = 1; i <= pdfjsDoc.numPages; i++) {
    const page = await pdfjsDoc.getPage(i);
    const viewport = page.getViewport({ scale: 1.0 });
    pageDetails.push({
      width: Math.round(viewport.width),
      height: Math.round(viewport.height),
      label: i.toString(),
    });

    const ops = await page.getOperatorList();
    for (let j = 0; j < ops.fnArray.length; j++) {
      if (ops.fnArray[j] === OPS.setFont) {
        const fontId = (ops.argsArray[j] as string[])[0];
        try {
          const font = await page.commonObjs.get(fontId);
          if (font?.name) fontsSet.add(font.name);
        } catch {
          // skip unresolved font refs
        }
      }
    }
  }

  let imageCount = 0;
  let formCount = 0;
  let totalImageSize = 0;
  const objects = pdfLibDoc.context.enumerateIndirectObjects();
  for (const [, obj] of objects) {
    let dict: PDFDict | undefined;
    if (obj instanceof PDFDict) {
      dict = obj;
    } else if (obj instanceof PDFStream || obj instanceof PDFRawStream) {
      dict = (obj as PDFStream & { dict: PDFDict }).dict;
    }

    if (dict) {
      const subtype = dict.get(PDFName.of("Subtype"));
      if (subtype === PDFName.of("Image")) {
        imageCount++;
        if (obj instanceof PDFRawStream) totalImageSize += obj.contents.length;
      } else if (subtype === PDFName.of("Form")) {
        formCount++;
      }
    }
  }

  const isProtected = isEncrypted;

  return {
    fileName,
    fileSizeStr,
    pages: pdfjsDoc.numPages,
    title: pdfLibDoc.getTitle() || "N/A",
    author: pdfLibDoc.getAuthor() || "N/A",
    creator: pdfLibDoc.getCreator() || "N/A",
    producer: pdfLibDoc.getProducer() || "N/A",
    creationDate: pdfLibDoc.getCreationDate()?.toLocaleString() || "N/A",
    modDate: pdfLibDoc.getModificationDate()?.toLocaleString() || "N/A",
    isEncrypted,
    version: pdfjsDoc._transport?.pdfjsVersion || "1.7",
    isLinearized: pdfjsDoc.isLinearized || false,
    fontCount: fontsSet.size,
    imageCount,
    formCount,
    imageRawSizeMb: (totalImageSize / 1024 / 1024).toFixed(2),
    pageDetails,
    fonts: Array.from(fontsSet),
    permissions: {
      printing: isProtected ? "not-allowed" : "allowed",
      modifying: isProtected ? "not-allowed" : "allowed",
      copying: isProtected ? "not-allowed" : "allowed",
      annotating: isProtected ? "not-allowed" : "allowed",
    },
  };
}

function getFallbackResult(fileName: string, sizeStr: string, encrypted: boolean): PdfAnalysisResult {
  return {
    fileName,
    fileSizeStr: sizeStr,
    pages: 0,
    title: "",
    author: "",
    creator: "",
    producer: "",
    creationDate: "",
    modDate: "",
    isEncrypted: encrypted,
    version: "N/A",
    isLinearized: false,
    fontCount: 0,
    imageCount: 0,
    formCount: 0,
    imageRawSizeMb: "0",
    pageDetails: [],
    fonts: [],
    permissions: {
      printing: "not-allowed",
      modifying: "not-allowed",
      copying: "not-allowed",
      annotating: "not-allowed",
    },
  };
}
