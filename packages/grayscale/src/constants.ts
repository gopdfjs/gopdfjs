/** pdf.js render scale for grayscale conversion. */
export const GRAYSCALE_RENDER_SCALE = 2;

/** JPEG quality for grayscale page images. */
export const GRAYSCALE_JPEG_QUALITY = 0.85;

export const GRAYSCALE_MODE = {
  GRAYSCALE: "grayscale",
  BW: "bw",
} as const;

export const FILTER_GRAYSCALE = "grayscale(100%)";
export const FILTER_BW = "grayscale(100%) contrast(200%) brightness(110%)";
