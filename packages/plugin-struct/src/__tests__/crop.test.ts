import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { cropPdf } from "../crop";
import { createMockPdf } from "./testUtils";

describe("cropPdf", () => {
  it("shrinks crop box by margins on every page", async () => {
    const pdf = await createMockPdf(2);
    const out = await cropPdf(pdf, { top: 10, bottom: 10, left: 5, right: 5 });
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(2);
    const page = doc.getPage(0);
    const crop = page.getCropBox();
    const media = page.getMediaBox();
    expect(crop.width).toBeLessThan(media.width);
    expect(crop.height).toBeLessThan(media.height);
  });
});
