import {
  compress_pdf,
  encode_images,
  grayscale_pdf,
  linearize_pdf,
} from "@gopdfjs/engine/pkg/gopdf_wasm.js";
import type { GopdfEngine, ImageFormat } from "@gopdfjs/adapter/engine";

let initialized = false;

async function ensureWasm(): Promise<void> {
  if (initialized) {
    return;
  }
  const initWasm = (await import("@gopdfjs/engine/pkg/gopdf_wasm.js")).default;
  await initWasm();
  initialized = true;
}

/** Browser WASM adapter — fetch-based init. */
export async function createBrowserEngine(): Promise<GopdfEngine> {
  await ensureWasm();
  return {
    async compressPdf(bytes, level, onProgress) {
      return compress_pdf(bytes, level, onProgress ? (p) => onProgress(p) : undefined);
    },
    async encodeImages(pixelsFlat, widths, heights, format: ImageFormat, quality = 92) {
      return encode_images(
        pixelsFlat,
        new Uint32Array(widths),
        new Uint32Array(heights),
        format,
        quality,
      );
    },
    async grayscalePdf(bytes) {
      return grayscale_pdf(bytes);
    },
    async linearizePdf(bytes) {
      return linearize_pdf(bytes);
    },
  };
}
