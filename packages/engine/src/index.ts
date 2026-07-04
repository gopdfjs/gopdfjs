import {
  compress_pdf,
  encode_images,
  grayscale_pdf,
  linearize_pdf,
} from "../pkg/gopdf_wasm.js";
import type { GopdfEngine } from "./types";

export * from "./types";
export { splitEncodedImages } from "./splitEncodedImages";

let initialized = false;

/**
 * Isomorphic WASM initializer.
 * Dynamically loads Node.js built-ins only when running in a Node.js environment,
 * preventing bundler errors in browser environments (like Vite).
 */
async function ensureWasm(): Promise<void> {
  if (initialized) return;

  const isBrowser = typeof window !== "undefined" || typeof self !== "undefined";

  if (isBrowser) {
    // Browser environment: load and initialize WASM using the default fetch-based initializer
    const initWasm = (await import("../pkg/gopdf_wasm.js")).default;
    await initWasm();
    initialized = true;
    return;
  }

  // Node.js environment: dynamically import Node.js built-ins to prevent browser bundler errors
  const fs = await import("node:fs");
  const path = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const { initSync } = await import("../pkg/gopdf_wasm.js");

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
    await ensureWasm();
    const progressFn = onProgress ? (p: number) => onProgress(p) : undefined;
    return compress_pdf(bytes, level, progressFn);
  },

  async encodeImages(pixelsFlat, widths, heights, format, quality = 92) {
    await ensureWasm();
    const w = new Uint32Array(widths);
    const h = new Uint32Array(heights);
    return encode_images(pixelsFlat, w, h, format, quality);
  },

  async grayscalePdf(bytes) {
    await ensureWasm();
    return grayscale_pdf(bytes);
  },

  async linearizePdf(bytes) {
    await ensureWasm();
    return linearize_pdf(bytes);
  },
};

export const compressPdf = engine.compressPdf;
export const encodeImages = engine.encodeImages;
export const grayscalePdf = engine.grayscalePdf;
export const linearizePdf = engine.linearizePdf;
