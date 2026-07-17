import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { reversePageOrder, reversePdf } from "../reverse";

describe("reversePageOrder", () => {
  it("returns descending indices for multi-page documents", () => {
    expect(reversePageOrder(5)).toEqual([4, 3, 2, 1, 0]);
  });

  it("returns empty array for zero pages", () => {
    expect(reversePageOrder(0)).toEqual([]);
  });

  it("returns [0] for single-page documents", () => {
    expect(reversePageOrder(1)).toEqual([0]);
  });
});

describe("reversePdf", () => {
  it("reverses page order on a 3-page PDF", async () => {
    const src = await PDFDocument.create();
    const sizes: [number, number][] = [
      [100, 200],
      [300, 400],
      [500, 600],
    ];
    for (const [w, h] of sizes) {
      src.addPage([w, h]);
    }
    const bytes = await src.save();

    const result = await reversePdf(bytes);
    const doc = await PDFDocument.load(result);

    expect(doc.getPageCount()).toBe(3);
    expect(doc.getPage(0).getSize().width).toBeCloseTo(500, 0);
    expect(doc.getPage(0).getSize().height).toBeCloseTo(600, 0);
    expect(doc.getPage(1).getSize().width).toBeCloseTo(300, 0);
    expect(doc.getPage(2).getSize().width).toBeCloseTo(100, 0);
  });
});
