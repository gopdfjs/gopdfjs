import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import {
  computeDrawRect,
  computeNUpCells,
  computeNUpOutputPageCount,
  nUpPdf,
  pagesPerSheet,
  slotToGrid,
  NUP_LAYOUTS,
} from "../nup";
import { createMockPdf } from "./testUtils";

describe("pagesPerSheet", () => {
  it("returns cols × rows", () => {
    expect(pagesPerSheet(NUP_LAYOUTS["2x2"])).toBe(4);
    expect(pagesPerSheet(NUP_LAYOUTS["2x3"])).toBe(6);
  });
});

describe("slotToGrid", () => {
  const grid = NUP_LAYOUTS["2x2"];

  it("maps z-order row-major", () => {
    expect(slotToGrid(0, grid, "z-order")).toEqual({ col: 0, row: 0 });
    expect(slotToGrid(1, grid, "z-order")).toEqual({ col: 1, row: 0 });
    expect(slotToGrid(2, grid, "z-order")).toEqual({ col: 0, row: 1 });
  });

  it("maps n-order column-major", () => {
    expect(slotToGrid(0, grid, "n-order")).toEqual({ col: 0, row: 0 });
    expect(slotToGrid(1, grid, "n-order")).toEqual({ col: 0, row: 1 });
    expect(slotToGrid(2, grid, "n-order")).toEqual({ col: 1, row: 0 });
  });
});

describe("computeNUpCells", () => {
  it("fits a 2×1 grid inside margins", () => {
    const cells = computeNUpCells(200, 100, NUP_LAYOUTS["2x1"], 10, 0);
    expect(cells).toHaveLength(2);
    expect(cells[0].width + cells[1].width).toBeCloseTo(180, 5);
    expect(cells[0].height).toBeCloseTo(80, 5);
  });
});

describe("computeDrawRect", () => {
  it("centers and scales down to fit", () => {
    const cell = { x: 0, y: 0, width: 100, height: 100 };
    const draw = computeDrawRect(cell, 200, 100);
    expect(draw.width).toBe(100);
    expect(draw.height).toBe(50);
    expect(draw.x).toBe(0);
    expect(draw.y).toBe(25);
  });
});

describe("computeNUpOutputPageCount", () => {
  it("ceil-divides by pages per sheet", () => {
    expect(computeNUpOutputPageCount(4, "2x2")).toBe(1);
    expect(computeNUpOutputPageCount(5, "2x2")).toBe(2);
    expect(computeNUpOutputPageCount(6, "2x3")).toBe(1);
  });
});

describe("nUpPdf", () => {
  it("combines four pages into one 2×2 sheet", async () => {
    const file = await createMockPdf(4);
    const result = await nUpPdf(file, { layout: "2x2" });
    const doc = await PDFDocument.load(result);
    expect(doc.getPageCount()).toBe(1);
    expect(doc.getPage(0).getSize().width).toBeCloseTo(200, 0);
  });

  it("produces a second sheet for partial batches", async () => {
    const file = await createMockPdf(5);
    const result = await nUpPdf(file, { layout: "2x2" });
    const doc = await PDFDocument.load(result);
    expect(doc.getPageCount()).toBe(2);
  });

  it("respects 1×2 layout page reduction", async () => {
    const file = await createMockPdf(4);
    const result = await nUpPdf(file, { layout: "1x2" });
    const doc = await PDFDocument.load(result);
    expect(doc.getPageCount()).toBe(2);
  });
});
