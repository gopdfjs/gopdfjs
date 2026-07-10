import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { rotatePdf } from "../rotate";
import { getRealPdf, createMockPdf } from "./testUtils";

describe("rotatePdf", () => {
  it("should rotate a real 1-page PDF by 90 degrees", async () => {
    const pdf = await getRealPdf();
    
    // Signature: (file, rotation, pageIndices)
    const rotatedBytes = await rotatePdf(pdf, 90, "all");
    const doc = await PDFDocument.load(rotatedBytes);
    const page = doc.getPage(0);
    expect(page.getRotation().angle).toBe(90);
  });

  it("should rotate specific pages in a mock multi-page PDF", async () => {
    const pdf = await createMockPdf(3);
    
    // Rotate only the first page by 180
    const rotatedBytes = await rotatePdf(pdf, 180, [0]);
    const doc = await PDFDocument.load(rotatedBytes);
    
    expect(doc.getPage(0).getRotation().angle).toBe(180);
    expect(doc.getPage(1).getRotation().angle).toBe(0);
    expect(doc.getPage(2).getRotation().angle).toBe(0);
  });
});
