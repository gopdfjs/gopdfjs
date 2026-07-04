import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { mergePdfs } from "../merge";
import { createMockPdf, getRealPdf } from "./testUtils";

describe("mergePdfs", () => {
  it("should merge a real 1-page PDF and a mock 1-page PDF into a 2-page PDF", async () => {
    const pdf1 = await getRealPdf();
    const pdf2 = await createMockPdf(1);
    
    const merged = await mergePdfs([pdf1, pdf2]);
    const doc = await PDFDocument.load(merged);
    expect(doc.getPageCount()).toBe(2);
  });
});
