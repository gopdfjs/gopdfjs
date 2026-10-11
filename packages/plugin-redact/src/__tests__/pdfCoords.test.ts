import { describe, expect, it } from "vitest";
import { pdfRegionToCanvasRect, viewportRectToPdfRegion } from "../pdfCoords";

const PAGE = { width: 612, height: 792 };

describe("pdfCoords", () => {
  it("maps viewport drag rect to PDF region", () => {
    const region = viewportRectToPdfRegion(
      0,
      { left: 200, top: 400, width: 100, height: 60 },
      PAGE,
      2,
    );
    expect(region.pageIndex).toBe(0);
    expect(region.x).toBeCloseTo(100);
    // PDF origin is bottom-left: y = pageHeight - (top + height) / scale
    expect(region.y).toBeCloseTo(792 - 230);
    expect(region.width).toBeCloseTo(50);
    expect(region.height).toBeCloseTo(30);
  });

  it("maps PDF region back to canvas rect", () => {
    const rect = pdfRegionToCanvasRect(
      { pageIndex: 0, x: 100, y: 500, width: 80, height: 20 },
      PAGE,
      2,
    );
    expect(rect.left).toBeCloseTo(200);
    expect(rect.top).toBeCloseTo((792 - 520) * 2);
    expect(rect.width).toBeCloseTo(160);
    expect(rect.height).toBeCloseTo(40);
  });

  it("round-trips a viewport rect through PDF space", () => {
    const drag = { left: 120, top: 260, width: 240, height: 90 };
    const scale = 1.5;
    const back = pdfRegionToCanvasRect(viewportRectToPdfRegion(0, drag, PAGE, scale), PAGE, scale);
    expect(back.left).toBeCloseTo(drag.left);
    expect(back.top).toBeCloseTo(drag.top);
    expect(back.width).toBeCloseTo(drag.width);
    expect(back.height).toBeCloseTo(drag.height);
  });
});
