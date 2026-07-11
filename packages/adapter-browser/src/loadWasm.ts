import init, {
  compress_pdf,
  encode_images,
  grayscale_pdf,
  linearize_pdf,
} from "@gopdfjs/wasm";

let initialized = false;

/** Browser init: no-arg `init()` fetches the co-located `gopdf_wasm_bg.wasm`. */
export async function loadGopdfWasm() {
  if (!initialized) {
    await init();
    initialized = true;
  }
  return { compress_pdf, encode_images, grayscale_pdf, linearize_pdf };
}
