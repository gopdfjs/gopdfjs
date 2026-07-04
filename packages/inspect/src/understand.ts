import { PDFDocument, PDFName, PDFDict, PDFStream, PDFRawStream } from "pdf-lib";
import { readFileAsArrayBuffer } from "@gopdfjs/files";
import { pdfjs } from "@gopdfjs/render";

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
  
  // Advanced Metrics
  fontCount: number;
  imageCount: number;
  formCount: number;
  imageRawSizeMb: string;
  
  // Page Breakdown
  pageDetails: { width: number, height: number, label: string }[];
  
  // Font List
  fonts: string[];
  
  // Security Permissions
  permissions: {
    printing: "allowed" | "not-allowed";
    modifying: "allowed" | "not-allowed";
    copying: "allowed" | "not-allowed";
    annotating: "allowed" | "not-allowed";
  };
}

// Internal types to avoid 'any'
interface PDFJsTransport {
  pdfjsVersion: string;
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
  _transport?: PDFJsTransport;
}

export async function analyzePdf(file: File): Promise<PdfAnalysisResult> {
  const bytes = await readFileAsArrayBuffer(file);
  const sizeMb = (file.size / 1024 / 1024).toFixed(2);
  const fileSizeStr = `${sizeMb} MB (${file.size.toLocaleString()} bytes)`;

  let pdfLibDoc: PDFDocument;
  let isEncrypted = false;

  // 1. Basic properties with pdf-lib (fast)
  try {
    pdfLibDoc = await PDFDocument.load(bytes, { updateMetadata: false });
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes('encrypted')) {
       isEncrypted = true;
       return getFallbackResult(file, fileSizeStr, true);
    }
    throw e;
  }

  // 2. Deep scan with pdfjs-dist
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(bytes) });
  const pdfjsDoc = (await loadingTask.promise) as unknown as PDFJsDocument;
  
  const pageDetails: { width: number, height: number, label: string }[] = [];
  const fontsSet = new Set<string>();
  
  for (let i = 1; i <= pdfjsDoc.numPages; i++) {
    const page = await pdfjsDoc.getPage(i);
    const viewport = page.getViewport({ scale: 1.0 });
    pageDetails.push({ width: Math.round(viewport.width), height: Math.round(viewport.height), label: i.toString() });
    
    // Extract fonts
    const ops = await page.getOperatorList();
    const OPS = (pdfjs as unknown as { OPS: { setFont: number } }).OPS;
    for (let j = 0; j < ops.fnArray.length; j++) {
      if (ops.fnArray[j] === OPS.setFont) {
        const fontId = (ops.argsArray[j] as string[])[0];
        try {
           const font = await page.commonObjs.get(fontId);
           if (font && font.name) fontsSet.add(font.name);
        } catch {
           // Skip
        }
      }
    }
  }

  // 3. Count XObjects
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
      const subtype = dict.get(PDFName.of('Subtype'));
      if (subtype === PDFName.of('Image')) {
        imageCount++;
        if (obj instanceof PDFRawStream) totalImageSize += obj.contents.length;
      } else if (subtype === PDFName.of('Form')) {
        formCount++;
      }
    }
  }

  const isProtected = isEncrypted;

  return {
    fileName: file.name,
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
    }
  };
}

function getFallbackResult(file: File, sizeStr: string, encrypted: boolean): PdfAnalysisResult {
  return {
    fileName: file.name,
    fileSizeStr: sizeStr,
    pages: 0, title: "", author: "", creator: "", producer: "", creationDate: "", modDate: "", 
    isEncrypted: encrypted, version: "N/A", isLinearized: false,
    fontCount: 0, imageCount: 0, formCount: 0, imageRawSizeMb: "0",
    pageDetails: [], fonts: [],
    permissions: {
      printing: "not-allowed", modifying: "not-allowed", copying: "not-allowed", annotating: "not-allowed"
    }
  };
}
