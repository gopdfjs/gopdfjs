export type CompressionLevel = "low" | "recommended" | "extreme";
export type ImageFormat = "jpeg" | "png";

export interface GopdfEngine {
  compressPdf(
    bytes: Uint8Array,
    level: CompressionLevel,
    onProgress?: (fraction: number) => void,
  ): Promise<Uint8Array>;

  encodeImages(
    pixelsFlat: Uint8Array,
    widths: number[],
    heights: number[],
    format: ImageFormat,
    quality?: number,
  ): Promise<Uint8Array>;

  grayscalePdf(bytes: Uint8Array): Promise<Uint8Array>;

  linearizePdf(bytes: Uint8Array): Promise<Uint8Array>;
}
