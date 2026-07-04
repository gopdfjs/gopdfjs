import { FILTER_BW, FILTER_GRAYSCALE, GRAYSCALE_MODE } from "./constants";
import type { GrayscaleMode } from "./types";

/** Canvas CSS filter for the selected conversion mode. */
export function canvasFilterForMode(mode: GrayscaleMode): string {
  return mode === GRAYSCALE_MODE.BW ? FILTER_BW : FILTER_GRAYSCALE;
}
