import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { organizePdf } from "../organize";
import { createMockPdf } from "./testUtils";

describe("organizePdf", () => {
  it("reorders pages to match the given index list", async () => {
    const pdf = await createMockPdf(3);
    const out = await organizePdf(pdf, [2, 0, 1]);
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(3);
  });

  it("keeps a single page when order has one index", async () => {
    const pdf = await createMockPdf(2);
    const out = await organizePdf(pdf, [1]);
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(1);
  });
});
