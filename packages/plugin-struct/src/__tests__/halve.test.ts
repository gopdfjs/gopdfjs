import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { computeHalveBoxes, halvePdf, clampSplitRatio } from "../halve";
import { createMockPdf } from "./testUtils";

describe("clampSplitRatio", () => {
  it("clamps values outside 5–95%", () => {
    expect(clampSplitRatio(0)).toBe(0.05);
    expect(clampSplitRatio(1)).toBe(0.95);
    expect(clampSplitRatio(0.5)).toBe(0.5);
  });
});

describe("computeHalveBoxes", () => {
  const box = { x: 0, y: 0, width: 200, height: 100 };

  it("splits vertically at center", () => {
    const [left, right] = computeHalveBoxes(box, "vertical", 0.5);
    expect(left).toEqual({ x: 0, y: 0, width: 100, height: 100 });
    expect(right).toEqual({ x: 100, y: 0, width: 100, height: 100 });
  });

  it("splits horizontally with top first", () => {
    const [top, bottom] = computeHalveBoxes(box, "horizontal", 0.5);
    expect(bottom).toEqual({ x: 0, y: 0, width: 200, height: 50 });
    expect(top).toEqual({ x: 0, y: 50, width: 200, height: 50 });
  });
});

describe("halvePdf", () => {
  it("doubles page count for a multi-page PDF", async () => {
    const file = await createMockPdf(3);
    const result = await halvePdf(file, { orientation: "vertical" });
    const doc = await PDFDocument.load(result);
    expect(doc.getPageCount()).toBe(6);
  });

  it("produces consistent half-page dimensions", async () => {
    const file = await createMockPdf(1);
    const result = await halvePdf(file, { orientation: "vertical", splitRatio: 0.5 });
    const doc = await PDFDocument.load(result);
    const first = doc.getPage(0).getSize();
    const second = doc.getPage(1).getSize();
    expect(first.width).toBeCloseTo(100, 0);
    expect(first.height).toBeCloseTo(200, 0);
    expect(second.width).toBeCloseTo(100, 0);
    expect(second.height).toBeCloseTo(200, 0);
  });
});
