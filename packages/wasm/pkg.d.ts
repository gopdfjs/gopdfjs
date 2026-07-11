/**
 * Stub before `pnpm build:wasm`. Real types come from pkg/gopdf_wasm.d.ts (web target).
 *
 * One wasm-pack `web` build serves both hosts:
 * - browser: `await init()` — fetches co-located `gopdf_wasm_bg.wasm`
 * - node: `await init(bytes)` / `initSync({ module: bytes })` — pass `.wasm` bytes
 */
declare module "./pkg/gopdf_wasm.js" {
  export default function init(
    module_or_path?: RequestInfo | URL | Response | BufferSource | WebAssembly.Module,
  ): Promise<WebAssembly.Instance>;
  export function initSync(module: { module: BufferSource | WebAssembly.Module }): WebAssembly.Instance;
  export function compress_pdf(
    bytes: Uint8Array,
    level: string,
    progress?: ((p: number) => void) | null,
  ): Uint8Array;
  export function encode_images(
    pixels_flat: Uint8Array,
    widths: Uint32Array,
    heights: Uint32Array,
    format: string,
    quality: number,
  ): Uint8Array;
  export function grayscale_pdf(bytes: Uint8Array): Uint8Array;
  export function linearize_pdf(bytes: Uint8Array): Uint8Array;
}
