/**
 * @gopdfjs/pdf-wasm — thin TypeScript facade over the WASM Worker.
 * PDF algorithms live in `crates/gopdf-*`; product orchestration in `@gopdfjs/tools`.
 */

import { dispatchWasmOp } from "./workerClient.ts";

export type CompressionLevel = "low" | "recommended" | "extreme";
export type ImageFormat = "jpeg" | "png";

export function compressPdf(
  bytes: Uint8Array,
  level: CompressionLevel,
  onProgress?: (fraction: number) => void,
): Promise<Uint8Array> {
  return dispatchWasmOp(
    "compress",
    { bytes, level, reportProgress: onProgress != null },
    [bytes.buffer],
    onProgress,
  );
}

export function encodeImages(
  pixelsFlat: Uint8Array,
  widths: number[],
  heights: number[],
  format: ImageFormat,
  quality = 92,
): Promise<Uint8Array> {
  const w = new Uint32Array(widths);
  const h = new Uint32Array(heights);
  return dispatchWasmOp(
    "encode_images",
    { pixels_flat: pixelsFlat, widths: w, heights: h, format, quality },
    [pixelsFlat.buffer, w.buffer, h.buffer],
  );
}

export { splitEncodedImages } from "./splitEncodedImages.ts";

export function grayscalePdf(bytes: Uint8Array): Promise<Uint8Array> {
  return dispatchWasmOp("grayscale", { bytes }, [bytes.buffer]);
}

export function linearizePdf(bytes: Uint8Array): Promise<Uint8Array> {
  return dispatchWasmOp("linearize", { bytes }, [bytes.buffer]);
}
