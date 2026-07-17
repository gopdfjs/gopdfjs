import { describe, it, expect } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import {
  computeResizeDrawRect,
  resolveTargetSize,
  resolveTargetSizeForPage,
  resizePdf,
  PAPER_PRESETS,
  mmToPt,
} from "../resize";
import { createMockPdf } from "./testUtils";

describe("computeResizeDrawRect", () => {
  const srcW = 100;
  const srcH = 200;
  const targetW = 300;
  const targetH = 300;

  it("fit letterboxes and centers content", () => {
    const rect = computeResizeDrawRect("fit", srcW, srcH, targetW, targetH);
    expect(rect).toEqual({ x: 75, y: 0, width: 150, height: 300 });
  });

  it("fill scales up and centers for crop", () => {
    const rect = computeResizeDrawRect("fill", srcW, srcH, targetW, targetH);
    expect(rect).toEqual({ x: 0, y: -150, width: 300, height: 600 });
  });

  it("stretch fills the target exactly", () => {
    const rect = computeResizeDrawRect("stretch", srcW, srcH, targetW, targetH);
    expect(rect).toEqual({ x: 0, y: 0, width: 300, height: 300 });
  });

  it("fit on square source fills target", () => {
    const rect = computeResizeDrawRect("fit", 200, 200, 400, 400);
    expect(rect).toEqual({ x: 0, y: 0, width: 400, height: 400 });
  });
});

describe("resolveTargetSize", () => {
  it("returns preset dimensions for A4", () => {
    const size = resolveTargetSize({ preset: "a4" });
    expect(size.width).toBeCloseTo(PAPER_PRESETS.a4.width, 1);
    expect(size.height).toBeCloseTo(PAPER_PRESETS.a4.height, 1);
  });

  it("returns preset dimensions for Letter", () => {
    const size = resolveTargetSize({ preset: "letter" });
    expect(size.width).toBe(612);
    expect(size.height).toBe(792);
  });

  it("converts custom millimeters to points", () => {
    const size = resolveTargetSize({ preset: "custom", widthMm: 210, heightMm: 297 });
    expect(size.width).toBeCloseTo(mmToPt(210), 1);
    expect(size.height).toBeCloseTo(mmToPt(297), 1);
  });
});

describe("resolveTargetSizeForPage", () => {
  const a4 = { preset: "a4" as const };

  it("uniform scope ignores source orientation", () => {
    const portrait = resolveTargetSizeForPage(a4, 400, 600, "uniform");
    const landscape = resolveTargetSizeForPage(a4, 600, 400, "uniform");
    expect(portrait).toEqual(landscape);
    expect(portrait.width).toBeCloseTo(PAPER_PRESETS.a4.width, 1);
  });

  it("perPage scope swaps dimensions for landscape source", () => {
    const portrait = resolveTargetSizeForPage(a4, 400, 600, "perPage");
    const landscape = resolveTargetSizeForPage(a4, 600, 400, "perPage");
    expect(portrait.width).toBeCloseTo(PAPER_PRESETS.a4.width, 1);
    expect(landscape.width).toBeCloseTo(PAPER_PRESETS.a4.height, 1);
    expect(landscape.height).toBeCloseTo(PAPER_PRESETS.a4.width, 1);
  });
});

describe("resizePdf", () => {
  it("preserves page count", async () => {
    const bytes = await createMockPdf(4);
    const result = await resizePdf(bytes, {
      target: { preset: "a4" },
      mode: "fit",
      scope: "uniform",
    });
    const doc = await PDFDocument.load(result);
    expect(doc.getPageCount()).toBe(4);
  });

  it("applies uniform A4 target to all pages", async () => {
    const bytes = await createMockPdf(2);
    const result = await resizePdf(bytes, {
      target: { preset: "a4" },
      mode: "fit",
      scope: "uniform",
    });
    const doc = await PDFDocument.load(result);
    for (const page of doc.getPages()) {
      const { width, height } = page.getSize();
      expect(width).toBeCloseTo(PAPER_PRESETS.a4.width, 0);
      expect(height).toBeCloseTo(PAPER_PRESETS.a4.height, 0);
    }
  });

  it("perPage scope orients target per source page size", async () => {
    const src = await PDFDocument.create();
    const font = await src.embedFont(StandardFonts.Helvetica);
    const sizes: [number, number][] = [
      [400, 600],
      [600, 400],
    ];
    for (const [w, h] of sizes) {
      const page = src.addPage([w, h]);
      page.drawText("x", { x: 10, y: 10, size: 12, font });
    }
    const bytes = await src.save();

    const result = await resizePdf(bytes, {
      target: { preset: "a4" },
      mode: "fit",
      scope: "perPage",
    });
    const doc = await PDFDocument.load(result);
    const page0 = doc.getPage(0).getSize();
    const page1 = doc.getPage(1).getSize();

    expect(page0.width).toBeCloseTo(PAPER_PRESETS.a4.width, 0);
    expect(page0.height).toBeCloseTo(PAPER_PRESETS.a4.height, 0);
    expect(page1.width).toBeCloseTo(PAPER_PRESETS.a4.height, 0);
    expect(page1.height).toBeCloseTo(PAPER_PRESETS.a4.width, 0);
  });
});
