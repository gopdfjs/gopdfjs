/** WASM compression / transform levels (RFC 0008). */
export type CompressionLevel = "low" | "recommended" | "extreme";

export type ImageFormat = "jpeg" | "png";

/**
 * Rust/WASM PDF engine — env-agnostic, bytes in/out.
 * All methods are async so browser (Worker) and Node (sync WASM) share one contract.
 * Implementations may wrap sync WASM; callers always await.
 */
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

/** Factory: load WASM / Worker and return a ready engine. */
export type CreateGopdfEngine = () => Promise<GopdfEngine>;
