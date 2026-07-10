import fs from "node:fs";
import { createRequire } from "node:module";
import type { GopdfEngine, ImageFormat } from "@gopdfjs/adapter/engine";

const require = createRequire(import.meta.url);

function resolveWasmJs(): string {
  return require.resolve("@gopdfjs/engine/pkg/gopdf_wasm.js");
}

function resolveWasmBg(): string {
  return require.resolve("@gopdfjs/engine/pkg/gopdf_wasm_bg.wasm");
}

let initialized = false;

async function loadWasmModule() {
  const wasmJs = resolveWasmJs();
  const wasmBg = resolveWasmBg();
  const { compress_pdf, encode_images, grayscale_pdf, linearize_pdf, initSync } =
    await import(wasmJs);

  if (!initialized) {
    initSync({ module: new Uint8Array(fs.readFileSync(wasmBg)) });
    initialized = true;
  }

  return { compress_pdf, encode_images, grayscale_pdf, linearize_pdf };
}

export async function createNodeEngine(): Promise<GopdfEngine> {
  const wasm = await loadWasmModule();

  return {
    async compressPdf(bytes, level, onProgress) {
      return wasm.compress_pdf(
        bytes,
        level,
        onProgress ? (p: number) => onProgress(p) : undefined,
      );
    },
    async encodeImages(pixelsFlat, widths, heights, format: ImageFormat, quality = 92) {
      return wasm.encode_images(
        pixelsFlat,
        new Uint32Array(widths),
        new Uint32Array(heights),
        format,
        quality,
      );
    },
    async grayscalePdf(bytes) {
      return wasm.grayscale_pdf(bytes);
    },
    async linearizePdf(bytes) {
      return wasm.linearize_pdf(bytes);
    },
  };
}
