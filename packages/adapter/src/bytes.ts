/**
 * PDF byte ownership (RFC 0058 §2.5).
 *
 * Host loads once → keeps one `Uint8Array` → may call many `engine.*(bytes)` methods.
 * **Engine facade** clones via `ownPdfBytes()` before adapter/plugin calls.
 * **Adapters** consume engine-owned bytes — do not clone or define clone policy here.
 * Use `clonePdfBytes` in tests or when simulating engine ownership.
 */

/** Independent copy — used by `@gopdfjs/engine` facade (`ownPdfBytes`). */
export function clonePdfBytes(bytes: Uint8Array): Uint8Array {
  return new Uint8Array(bytes);
}

/** Test helper — throws if buffer was detached (pdf.js regression). */
export function assertPdfBytesReadable(bytes: Uint8Array, label = "PDF bytes"): void {
  try {
    // slice touches the underlying ArrayBuffer; detached buffers throw
    bytes.slice(0, 0);
  } catch {
    throw new Error(`${label}: ArrayBuffer is detached or out of bounds`);
  }
}

/** Simulate pdf.js transferring (detaching) the buffer it receives. */
export function detachArrayBuffer(view: Uint8Array): void {
  const { port1, port2 } = new MessageChannel();
  port1.postMessage(view, [view.buffer]);
  port2.onmessage = () => undefined;
}
