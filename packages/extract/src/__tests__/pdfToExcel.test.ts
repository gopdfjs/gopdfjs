import { describe, it, expect } from "vitest";
import { detectTablesFromFragments } from "../pdfToExcel/detectTables";
import { mergeContinuationRows, parseCellValue } from "../pdfToExcel/parseCellValue";

describe("parseCellValue", () => {
  it("parses integers and decimals", () => {
    expect(parseCellValue("42")).toBe(42);
    expect(parseCellValue("1,234.5")).toBe(1234.5);
  });

  it("parses iso dates", () => {
    const d = parseCellValue("2024-06-15");
    expect(d).toBeInstanceOf(Date);
  });

  it("keeps plain text", () => {
    expect(parseCellValue("Revenue")).toBe("Revenue");
  });
});

describe("mergeContinuationRows", () => {
  it("merges single-column continuation into previous row", () => {
    const merged = mergeContinuationRows([
      ["A", "1"],
      ["continued", ""],
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0][0]).toBe("A\ncontinued");
    expect(merged[0][1]).toBe("1");
  });
});

describe("detectTablesFromFragments", () => {
  it("detects borderless aligned grid (hidden table)", () => {
    const fragments = [
      { text: "Name", x: 72, y: 700, width: 40 },
      { text: "Qty", x: 200, y: 700, width: 30 },
      { text: "Price", x: 320, y: 700, width: 40 },
      { text: "Apple", x: 72, y: 680, width: 40 },
      { text: "3", x: 200, y: 680, width: 10 },
      { text: "1.50", x: 320, y: 680, width: 30 },
      { text: "Banana", x: 72, y: 660, width: 45 },
      { text: "5", x: 200, y: 660, width: 10 },
      { text: "0.75", x: 320, y: 660, width: 30 },
    ];

    const tables = detectTablesFromFragments(fragments, 0);
    expect(tables).toHaveLength(1);
    expect(tables[0].rows).toHaveLength(3);
    expect(tables[0].rows[0].cells[0]).toBe("Name");
    expect(tables[0].rows[1].cells[2]).toBe("1.50");
  });

  it("respects column anchor offsets for boundary refinement", () => {
    const fragments = [
      { text: "A", x: 70, y: 500, width: 20 },
      { text: "B", x: 210, y: 500, width: 20 },
      { text: "1", x: 72, y: 480, width: 10 },
      { text: "2", x: 212, y: 480, width: 10 },
    ];
    const base = detectTablesFromFragments(fragments, 0);
    expect(base[0].rows[0].cells).toEqual(["A", "B"]);

    const refined = detectTablesFromFragments(fragments, 0, {
      columnAnchorOffsets: { "0-0": [0, -20] },
    });
    expect(refined[0].columnAnchors.length).toBe(2);
  });
});
