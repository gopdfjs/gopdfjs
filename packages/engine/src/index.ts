import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import initWasm, {
  initSync,
  compress_pdf,
  encode_images,
  grayscale_pdf,
  linearize_pdf,
} from "../pkg/gopdf_wasm.js";
import type { GopdfEngine } from "./types.ts";

export * from "./types.ts";
export { splitEncodedImages } from "./splitEncodedImages.ts";

let initialized = false;

function ensureWasm(): void {
  if (initialized) return;

  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const WASM_PATH = path.resolve(currentDir, "../pkg/gopdf_wasm_bg.wasm");

  if (!fs.existsSync(WASM_PATH)) {
    throw new Error(
      `WASM binary not found at: ${WASM_PATH}. Run \`pnpm build:wasm\` in monorepo root.`,
    );
  }

  const wasmBytes = new Uint8Array(fs.readFileSync(WASM_PATH));
  initSync({ module: wasmBytes });
  initialized = true;
}

export const engine: GopdfEngine = {
  async compressPdf(bytes, level, onProgress) {
    ensureWasm();
    const progressFn = onProgress ? (p: number) => onProgress(p) : undefined;
    return compress_pdf(bytes, level, progressFn);
  },

  async encodeImages(pixelsFlat, widths, heights, format, quality = 92) {
    ensureWasm();
    const w = new Uint32Array(widths);
    const h = new Uint32Array(heights);
    return encode_images(pixelsFlat, w, h, format, quality);
  },

  async grayscalePdf(bytes) {
    ensureWasm();
    return grayscale_pdf(bytes);
  },

  async linearizePdf(bytes) {
    ensureWasm();
    return linearize_pdf(bytes);
  },
};

export const compressPdf = engine.compressPdf;
export const encodeImages = engine.encodeImages;
export const grayscalePdf = engine.grayscalePdf;
export const linearizePdf = engine.linearizePdf;
