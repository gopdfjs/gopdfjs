import { describe, it, expect } from "vitest";
import { canvasFilterForMode } from "../canvasFilter";
import { FILTER_BW, FILTER_GRAYSCALE, GRAYSCALE_MODE } from "../constants";

describe("canvasFilterForMode", () => {
  it("maps grayscale mode to natural gray filter", () => {
    expect(canvasFilterForMode(GRAYSCALE_MODE.GRAYSCALE)).toBe(FILTER_GRAYSCALE);
  });

  it("maps bw mode to high-contrast filter", () => {
    expect(canvasFilterForMode(GRAYSCALE_MODE.BW)).toBe(FILTER_BW);
  });
});
