import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import init, {
  compress_pdf,
  encode_images,
  grayscale_pdf,
  linearize_pdf,
} from "@gopdfjs/wasm";

let initialized = false;

/** Published dist: `./gopdf_wasm_bg.wasm` beside bundle. Monorepo dev: `@gopdfjs/wasm` pkg. */
function resolveWasmPath(): string {
  const vendored = fileURLToPath(new URL("./gopdf_wasm_bg.wasm", import.meta.url));
  if (existsSync(vendored)) return vendored;
  if (typeof import.meta.resolve === "function") {
    return fileURLToPath(import.meta.resolve("@gopdfjs/wasm/gopdf_wasm_bg.wasm"));
  }
  return createRequire(import.meta.url).resolve("@gopdfjs/wasm/gopdf_wasm_bg.wasm");
}

/** Node init: same web-target glue; feed `.wasm` bytes (no fetch in Node). */
export async function loadGopdfWasm() {
  if (!initialized) {
    await init({ module_or_path: readFileSync(resolveWasmPath()) });
    initialized = true;
  }
  return { compress_pdf, encode_images, grayscale_pdf, linearize_pdf };
}
