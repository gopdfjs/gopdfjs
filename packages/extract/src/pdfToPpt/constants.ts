import type { SlideLayout } from "./types";

export const RENDER_SCALE = 2;
export const LINE_Y_TOLERANCE_PT = 3;
export const PT_PER_INCH = 72;

export const SLIDE_LAYOUTS: Record<
  SlideLayout,
  { pptLayout: string; widthIn: number; heightIn: number }
> = {
  "16x9": { pptLayout: "LAYOUT_16x9", widthIn: 10, heightIn: 5.625 },
  "4x3": { pptLayout: "LAYOUT_4x3", widthIn: 10, heightIn: 7.5 },
};
