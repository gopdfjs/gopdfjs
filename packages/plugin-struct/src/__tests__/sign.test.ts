import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { signPdf } from "../sign";
import { createMockPdf } from "./testUtils";
import { ONE_PX_PNG } from "./fixtures/onePxPng";

describe("signPdf", () => {
  it("embeds a PNG stamp on the requested page", async () => {
    const pdf = await createMockPdf(1);
    const out = await signPdf(pdf, ONE_PX_PNG, {
      pageIndex: 0,
      x: 10,
      y: 10,
      width: 20,
      height: 20,
    });
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(1);
    expect(out.byteLength).toBeGreaterThan(pdf.byteLength);
  });
});
