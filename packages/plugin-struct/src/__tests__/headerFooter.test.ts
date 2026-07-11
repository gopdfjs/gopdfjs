import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { addHeaderFooter } from "../headerFooter";
import { createMockPdf } from "./testUtils";

describe("addHeaderFooter", () => {
  it("draws header and footer on every page", async () => {
    const pdf = await createMockPdf(2);
    const out = await addHeaderFooter(pdf, {
      header: "Header {page}/{total}",
      footer: "Footer {page}",
      fontSize: 10,
      color: "#333333",
      margin: 24,
    });
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(2);
    expect(out.byteLength).toBeGreaterThan(pdf.byteLength);
  });
});
