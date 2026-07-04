import type { PdfDocument } from "./types";
import { getPdfjs } from "./worker";

/** Load PDF bytes; slice buffer so pdf.js worker transfer does not detach source. */
export async function loadPdfDocument(data: ArrayBuffer | Uint8Array): Promise<PdfDocument> {
    const pdfjs = await getPdfjs();
    const bytes = data instanceof ArrayBuffer ? data.slice(0) : data;
    const doc = await pdfjs.getDocument({ data: new Uint8Array(bytes) }).promise;
    return doc as unknown as PdfDocument;
}

export async function loadPdfFromFile(file: File): Promise<PdfDocument> {
    return loadPdfDocument(await file.arrayBuffer());
}
