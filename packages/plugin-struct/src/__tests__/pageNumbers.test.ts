import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { addPageNumbers } from "../pageNumbers";
import { createMockPdf } from "./testUtils";

describe("addPageNumbers", () => {
  it("adds numbered labels on each page", async () => {
    const pdf = await createMockPdf(2);
    const out = await addPageNumbers(pdf, {
      position: "bottom-center",
      startNumber: 1,
      fontSize: 12,
      prefix: "p",
      suffix: "",
      color: "#000000",
    });
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(2);
    expect(out.byteLength).toBeGreaterThan(pdf.byteLength);
  });
});
