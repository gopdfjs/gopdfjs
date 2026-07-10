import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { splitPdf } from "../split";
import { createMockPdf, getRealPdf } from "./testUtils";

describe("splitPdf", () => {
  it("should split a document containing a real PDF page and mock pages", async () => {
    const realPdf = await getRealPdf();
    const mockPdf = await createMockPdf(4);
    
    // Create a 5-page PDF by merging real + mock (first page is real)
    const { mergePdfs } = await import("../merge");
    const docBytes = await mergePdfs([realPdf, mockPdf]);
    const ranges = [[0], [1, 2, 3, 4]];
    const chunks = await splitPdf(docBytes, ranges);
    expect(chunks.length).toBe(2);

    const doc1 = await PDFDocument.load(chunks[0]);
    expect(doc1.getPageCount()).toBe(1);

    const doc2 = await PDFDocument.load(chunks[1]);
    expect(doc2.getPageCount()).toBe(4);
  });
});
