import type { GopdfEngine, ImageFormat } from "@gopdfjs/adapter/engine";
import { loadGopdfWasm } from "./loadWasm";

/** Browser `GopdfEngine` — loads shared `@gopdfjs/wasm`, init fetches co-located `.wasm`. */
export async function createBrowserEngine(): Promise<GopdfEngine> {
  const { compress_pdf, encode_images, grayscale_pdf, linearize_pdf } = await loadGopdfWasm();
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
