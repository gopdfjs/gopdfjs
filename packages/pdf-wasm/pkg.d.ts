/**
 * Type stubs for the wasm-pack generated output in ./pkg/.
 *
 * This file exists so TypeScript does not error on `import ... from './pkg/pdf_wasm.js'`
 * before `wasm-pack build` has been run. The real types are generated into
 * ./pkg/pdf_wasm.d.ts by wasm-pack and take precedence at runtime.
 *
 * Do not edit — real types come from wasm-pack output.
 */
declare module "./pkg/pdf_wasm.js" {
  /** Initialize the WASM module. Must be awaited before calling any other export. */
  export default function init(input?: RequestInfo | URL | Response | BufferSource | WebAssembly.Module): Promise<WebAssembly.Instance>;

  /** Re-compress all FlateDecode streams in a PDF. */
  export function compress_pdf(bytes: Uint8Array, level: string): Uint8Array;

  /** Encode raw RGBA pixel buffers as JPEG or PNG (length-prefixed output). */
  export function encode_images(
    pixels_flat: Uint8Array,
    widths: Uint32Array,
    heights: Uint32Array,
    format: string,
    quality: number,
  ): Uint8Array;

  /** Convert embedded color images in a PDF to DeviceGray. */
  export function grayscale_pdf(bytes: Uint8Array): Uint8Array;

  /** Inject the Linearized dictionary for Fast Web View. */
  export function linearize_pdf(bytes: Uint8Array): Uint8Array;
}
