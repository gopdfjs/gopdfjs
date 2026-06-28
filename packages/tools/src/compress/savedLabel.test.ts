import { describe, expect, it } from "vitest";
import { formatCompressionSavedLabel } from "./savedLabel";

describe("formatCompressionSavedLabel", () => {
  it("formats percent when smaller output", () => {
    expect(formatCompressionSavedLabel(0.25)).toBe("25%");
  });

  it("shows no-reduction copy when ratio is zero", () => {
    expect(formatCompressionSavedLabel(0)).toContain("No reduction");
  });
});
