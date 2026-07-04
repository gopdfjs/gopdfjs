import { describe, expect, it } from "vitest";
import { pdfRegionToCanvasRect, viewportRectToPdfRegion } from "../pdfCoords";

/** Minimal viewport mock for coordinate round-trip. */
function mockViewport(width: number, height: number) {
  const scale = 1;
  return {
    width: width * scale,
    height: height * scale,
    convertToPdfPoint: (vx: number, vy: number) => [vx / scale, height - vy / scale] as [number, number],
    convertToViewportPoint: (px: number, py: number) => [px * scale, (height - py) * scale] as [number, number],
  };
}

describe("pdfCoords", () => {
  it("maps viewport drag rect to PDF region", () => {
    const vp = mockViewport(612, 792);
    const region = viewportRectToPdfRegion(0, { left: 100, top: 200, width: 50, height: 30 }, vp as never);
    expect(region.pageIndex).toBe(0);
    expect(region.width).toBeGreaterThan(0);
    expect(region.height).toBeGreaterThan(0);
  });

  it("maps PDF region back to canvas rect", () => {
    const vp = mockViewport(612, 792);
    const region = { pageIndex: 0, x: 100, y: 500, width: 80, height: 20 };
    const rect = pdfRegionToCanvasRect(region, vp as never);
    expect(rect.width).toBeGreaterThan(0);
    expect(rect.height).toBeGreaterThan(0);
  });
});
