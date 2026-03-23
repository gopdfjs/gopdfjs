/**
 * Host-side proxy for @gopdfjs/pdf-wasm.
 *
 * Creates a singleton Worker per page lifecycle and wraps each WASM call in a
 * Promise. ArrayBuffers are transferred (zero-copy) across the thread boundary.
 *
 * Usage:
 *   import { compressPdf } from "@gopdfjs/pdf-wasm";
 *   const result = await compressPdf(bytes, "recommended");
 */

type PendingCall = {
  resolve: (value: Uint8Array) => void;
  reject: (reason: Error) => void;
  onProgress?: (fraction: number) => void;
};

let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<number, PendingCall>();

function getWorker(): Worker {
  if (!worker) {
    // new URL(..., import.meta.url) lets bundlers (Turbopack, Vite) correctly
    // resolve the Worker path at build time.
    worker = new Worker(new URL("./worker.ts", import.meta.url), {
      type: "module",
    });

    worker.onmessage = (
      e: MessageEvent<
        | { id: number; ok: true; result: Uint8Array }
        | { id: number; ok: true; progress: number }
        | { id: number; ok: false; error: string }
      >,
    ) => {
      const msg = e.data;
      const call = pending.get(msg.id);
      if (!call) return;

      if (msg.ok && "progress" in msg) {
        call.onProgress?.(msg.progress);
        return; // keep pending — not done yet
      }

      pending.delete(msg.id);

      if (msg.ok) {
        call.resolve(msg.result);
      } else {
        call.reject(new Error(msg.error));
      }
    };

    worker.onerror = (e) => {
      // Reject all pending calls if the Worker crashes
      for (const [, call] of pending) {
        call.reject(new Error(`WASM Worker crashed: ${e.message}`));
      }
      pending.clear();
      worker = null; // allow re-creation on next call
    };
  }
  return worker;
}

function call(
  op: string,
  payload: Record<string, unknown>,
  transfer: Transferable[],
  onProgress?: (fraction: number) => void,
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject, onProgress });
    getWorker().postMessage({ id, op, payload }, transfer);
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

export type CompressionLevel = "low" | "recommended" | "extreme";

/**
 * Re-compress all FlateDecode streams in a PDF. (RFC 0008)
 *
 * @param bytes     Raw PDF bytes — the buffer is transferred to the Worker.
 * @param level     Compression preset.
 * @param onProgress  Optional callback receiving 0–1 progress fraction.
 */
export function compressPdf(
  bytes: Uint8Array,
  level: CompressionLevel,
  onProgress?: (fraction: number) => void,
): Promise<Uint8Array> {
  return call(
    "compress",
    { bytes, level, reportProgress: onProgress != null },
    [bytes.buffer],
    onProgress,
  );
}

export type ImageFormat = "jpeg" | "png";

/**
 * Encode raw RGBA pixel buffers as JPEG or PNG. (RFC 0017, RFC 0018)
 *
 * Each frame is described by `widths[i]` × `heights[i]` pixels.
 * The `pixelsFlat` array must be the frames concatenated in order.
 *
 * Returns a Uint8Array with length-prefixed encoded images
 * (4-byte big-endian length followed by the encoded bytes, repeated per frame).
 * Use `splitEncodedImages()` to unpack.
 */
export function encodeImages(
  pixelsFlat: Uint8Array,
  widths: number[],
  heights: number[],
  format: ImageFormat,
  quality = 92,
): Promise<Uint8Array> {
  const w = new Uint32Array(widths);
  const h = new Uint32Array(heights);
  return call(
    "encode_images",
    { pixels_flat: pixelsFlat, widths: w, heights: h, format, quality },
    [pixelsFlat.buffer, w.buffer, h.buffer],
  );
}

export { splitEncodedImages } from "./splitEncodedImages.ts";

/**
 * Convert all embedded color images in a PDF to DeviceGray. (RFC 0028)
 */
export function grayscalePdf(bytes: Uint8Array): Promise<Uint8Array> {
  return call("grayscale", { bytes }, [bytes.buffer]);
}

/**
 * Rewrite a PDF for Fast Web View (linearization). (RFC 0042)
 */
export function linearizePdf(bytes: Uint8Array): Promise<Uint8Array> {
  return call("linearize", { bytes }, [bytes.buffer]);
}
