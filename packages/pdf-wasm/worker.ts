/**
 * Web Worker entry point for @gopdfjs/pdf-wasm.
 *
 * Imports the WASM module (built by wasm-pack --target web) and routes
 * messages from the host proxy (index.ts) to the appropriate Rust function.
 *
 * Message protocol:
 *   Host → Worker: { id: number, op: string, payload: object }
 *   Worker → Host: { id: number, ok: true,  result: Uint8Array }   // done
 *                  { id: number, ok: true,  progress: number }      // 0–1 progress
 *                  { id: number, ok: false, error: string }         // failure
 *
 * All Uint8Array results are transferred (not copied) via Transferable.
 */

import init, {
  compress_pdf,
  encode_images,
  grayscale_pdf,
  linearize_pdf,
} from "./pkg/pdf_wasm.js";

// Initialize WASM once when the Worker starts (top-level await in module Worker)
await init();

type Op =
  | {
      op: "compress";
      payload: { bytes: Uint8Array; level: string; reportProgress?: boolean };
    }
  | { op: "encode_images"; payload: { pixels_flat: Uint8Array; widths: Uint32Array; heights: Uint32Array; format: string; quality: number } }
  | { op: "grayscale";  payload: { bytes: Uint8Array } }
  | { op: "linearize";  payload: { bytes: Uint8Array } };

self.onmessage = async (e: MessageEvent<{ id: number } & Op>) => {
  const { id, op, payload } = e.data;

  try {
    let result: Uint8Array;

    switch (op) {
      case "compress": {
        const reportProgress = payload.reportProgress === true;
        const onProgress = reportProgress
          ? (p: number) => {
              self.postMessage({ id, ok: true, progress: p });
            }
          : undefined;
        result = compress_pdf(payload.bytes, payload.level, onProgress);
        break;
      }

      case "encode_images": {
        result = encode_images(
          payload.pixels_flat,
          payload.widths,
          payload.heights,
          payload.format,
          payload.quality,
        );
        break;
      }

      case "grayscale": {
        result = grayscale_pdf(payload.bytes);
        break;
      }

      case "linearize": {
        result = linearize_pdf(payload.bytes);
        break;
      }

      default: {
        const _exhaustive: never = op;
        throw new Error(`Unknown op: ${String(_exhaustive)}`);
      }
    }

    // Transfer the buffer back without copying
    self.postMessage({ id, ok: true, result }, { transfer: [result.buffer] });
  } catch (err) {
    self.postMessage({ id, ok: false, error: String(err) });
  }
};
