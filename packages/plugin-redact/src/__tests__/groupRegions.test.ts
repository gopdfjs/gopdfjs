import { describe, expect, it } from "vitest";
import { groupRegionsByPage } from "../groupRegions";

describe("groupRegionsByPage", () => {
  it("groups regions by page index", () => {
    const map = groupRegionsByPage([
      { pageIndex: 0, x: 1, y: 2, width: 3, height: 4 },
      { pageIndex: 1, x: 5, y: 6, width: 7, height: 8 },
      { pageIndex: 0, x: 9, y: 10, width: 11, height: 12 },
    ]);
    expect(map.get(0)).toHaveLength(2);
    expect(map.get(1)).toHaveLength(1);
  });
});
