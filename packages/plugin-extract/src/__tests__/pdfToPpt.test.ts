import { describe, it, expect } from "vitest";
import { ptToSlideInches, pdfYToSlideTopInches, fontSizePtToSlidePoints } from "../pdfToPpt/coordinates";
import { extractTextBoxesFromItems } from "../pdfToPpt/extractTextBoxes";

describe("coordinates", () => {
  it("maps page width pt to slide inches", () => {
    expect(ptToSlideInches(612, 612, 10)).toBeCloseTo(10, 2);
    expect(ptToSlideInches(306, 612, 10)).toBeCloseTo(5, 2);
  });

  it("flips PDF y to slide top", () => {
    const top = pdfYToSlideTopInches(700, 12, 792, 5.625);
    expect(top).toBeGreaterThan(0);
    expect(top).toBeLessThan(5.625);
  });

  it("scales font size to slide points", () => {
    const pts = fontSizePtToSlidePoints(12, 792, 5.625);
    expect(pts).toBeGreaterThanOrEqual(8);
  });
});

describe("extractTextBoxesFromItems", () => {
  it("groups aligned text into editable boxes", () => {
    const items = [
      {
        str: "Hello",
        transform: [12, 0, 0, 12, 72, 700],
        width: 40,
        fontName: "Arial",
      },
      {
        str: "World",
        transform: [12, 0, 0, 12, 130, 700],
        width: 45,
        fontName: "Arial-Bold",
      },
    ] as Parameters<typeof extractTextBoxesFromItems>[0];

    const boxes = extractTextBoxesFromItems(items, 612, 792, 10, 5.625);
    expect(boxes).toHaveLength(1);
    expect(boxes[0].text).toBe("Hello World");
    expect(boxes[0].bold).toBe(true);
    expect(boxes[0].w).toBeGreaterThan(0.5);
  });
});
