import { describe, it, expect } from "vitest";
import { groupTextItemsIntoRuns } from "../textRuns";

describe("groupTextItemsIntoRuns", () => {
  it("merges items on the same baseline into one run", () => {
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
    ] as Parameters<typeof groupTextItemsIntoRuns>[0];

    const runs = groupTextItemsIntoRuns(items, 0);
    expect(runs).toHaveLength(1);
    expect(runs[0].text).toBe("Hello World");
    expect(runs[0].pageIndex).toBe(0);
    expect(runs[0].fontSize).toBeCloseTo(12, 0);
  });
});
