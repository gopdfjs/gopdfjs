import { describe, expect, it } from "vitest";
import {
  buildCompressionStats,
  compressionSavedRatio,
  formatFileSize,
} from "./stats";

describe("formatFileSize", () => {
  it("formats bytes and kilobytes", () => {
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(2048)).toBe("2.00 KB");
  });

  it("guards invalid input", () => {
    expect(formatFileSize(-1)).toBe("0 B");
    expect(formatFileSize(Number.NaN)).toBe("0 B");
  });
});

describe("compressionSavedRatio", () => {
  it("returns zero when output is not smaller", () => {
    expect(compressionSavedRatio(100, 100)).toBe(0);
    expect(compressionSavedRatio(100, 120)).toBe(0);
    expect(compressionSavedRatio(0, 0)).toBe(0);
  });

  it("computes savings for smaller output", () => {
    expect(compressionSavedRatio(1000, 750)).toBeCloseTo(0.25);
  });
});

describe("buildCompressionStats", () => {
  it("builds labels and ratio together", () => {
    const stats = buildCompressionStats(10_000, 7_500);
    expect(stats.inputBytes).toBe(10_000);
    expect(stats.outputBytes).toBe(7_500);
    expect(stats.savedRatio).toBeCloseTo(0.25);
    expect(stats.inputLabel).toContain("KB");
    expect(stats.outputLabel).toContain("KB");
  });
});
