import type { GRAYSCALE_MODE } from "./constants";

export type GrayscaleMode = (typeof GRAYSCALE_MODE)[keyof typeof GRAYSCALE_MODE];

export type GrayscalePdfOptions = {
  mode: GrayscaleMode;
  renderScale?: number;
  jpegQuality?: number;
};

export type GrayscalePdfResult = {
  bytes: Uint8Array;
  inputPages: number;
  outputPages: number;
  inputBytes: number;
  outputBytes: number;
};

export type PreviewPair = {
  colorDataUrl: string;
  grayDataUrl: string;
};

export type GrayscaleProgressCallback = (current: number, total: number) => void;

export type RasterizedGrayscalePage = {
  jpegBytes: Uint8Array;
  widthPt: number;
  heightPt: number;
};
