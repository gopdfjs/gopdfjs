import { detachArrayBuffer } from "@gopdfjs/adapter/bytes";

/** Simulates pdf.js / WASM transferring (detaching) the buffer they receive. */
export function detachIncomingBytes(args: readonly unknown[]): void {
  for (const arg of args) {
    if (arg instanceof Uint8Array) {
      detachArrayBuffer(arg);
      return;
    }
    if (Array.isArray(arg)) {
      for (const item of arg) {
        if (item instanceof Uint8Array) {
          detachArrayBuffer(item);
          return;
        }
        if (item && typeof item === "object" && "bytes" in item) {
          const nested = (item as { bytes: Uint8Array }).bytes;
          if (nested instanceof Uint8Array) {
            detachArrayBuffer(nested);
            return;
          }
        }
      }
    }
  }
}
