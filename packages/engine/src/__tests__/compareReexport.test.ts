import { describe, expect, it } from "vitest";
import { ComparePageCache, diffPdfText } from "../compare";

describe("@gopdfjs/engine/compare re-export", () => {
  it("re-exports compare helpers", () => {
    expect(typeof ComparePageCache).toBe("function");
    expect(typeof diffPdfText).toBe("function");
  });
});
