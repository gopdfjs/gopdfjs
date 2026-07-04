import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { watermarkPdf } from "../watermark";
import { getRealPdf, createMockPdf } from "./testUtils";

describe("watermarkPdf", () => {
  it("should add a text watermark to a real PDF", async () => {
    const pdf = await getRealPdf();
    
    // Signature: (file, content, opts)
    const watermarkedBytes = await watermarkPdf(
      pdf,
      { text: "CONFIDENTIAL" },
      { fontSize: 50, opacity: 0.5, rotation: 45, color: "#FF0000", tile: false, position: "center" }
    );
    
    const doc = await PDFDocument.load(watermarkedBytes);
    expect(doc.getPageCount()).toBe(1);
  });

  it("should add a tiled watermark to a mock multi-page PDF", async () => {
    const pdf = await createMockPdf(3);
    
    const watermarkedBytes = await watermarkPdf(
      pdf,
      { text: "DRAFT" },
      { fontSize: 20, opacity: 0.2, rotation: 0, color: "#0000FF", tile: true, position: "center" }
    );
    
    const doc = await PDFDocument.load(watermarkedBytes);
    expect(doc.getPageCount()).toBe(3);
  });
});
