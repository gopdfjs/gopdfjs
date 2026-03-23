mod compress;
mod image_ops;
mod linearize;
mod utils;

use js_sys::Function;
use wasm_bindgen::prelude::*;

/// Called once when the WASM module is first loaded in the Worker.
/// Sets up the panic hook so Rust panics appear in the browser console.
#[wasm_bindgen(start)]
pub fn init() {
    utils::set_panic_hook();
}

// ── Compress (RFC 0008) ───────────────────────────────────────────────────────

/// Re-compress all FlateDecode streams in a PDF at the requested level.
///
/// `level`: "low" | "recommended" | "extreme"
///
/// `progress`: optional JS `function (fraction: number) {}` — called with **0**, intermediate
/// values in `(0, 1)` by scan offset, and **1** on success. Pass `undefined` to skip JS calls
/// (Worker should still set `reportProgress` only when the host wants updates).
///
/// Returns the modified PDF bytes, or throws a JS Error on failure.
#[wasm_bindgen]
pub fn compress_pdf(
    bytes: &[u8],
    level: &str,
    progress: Option<Function>,
) -> Result<Vec<u8>, JsError> {
    compress::compress_pdf(bytes, level, |p| {
        if let Some(cb) = progress.as_ref() {
            let _ = cb.call1(&JsValue::NULL, &JsValue::from_f64(p as f64));
        }
    })
    .map_err(|e| JsError::new(&e))
}

// ── Image ops (RFC 0017 JPG→PDF, RFC 0018 PDF→JPG, RFC 0028 Grayscale) ──────

/// Encode a batch of raw RGBA pixel buffers as JPEG or PNG.
///
/// `pixels_flat`: flat Uint8Array of RGBA bytes for all frames concatenated.
/// `widths` / `heights`: per-frame dimensions (same length).
/// `format`: "jpeg" | "png"
/// `quality`: 0–100 (JPEG only; ignored for PNG)
///
/// Returns a flat byte array of all encoded images concatenated, with each
/// image preceded by a 4-byte big-endian length prefix so the host can split them.
#[wasm_bindgen]
pub fn encode_images(
    pixels_flat: &[u8],
    widths: &[u32],
    heights: &[u32],
    format: &str,
    quality: u8,
) -> Result<Vec<u8>, JsError> {
    image_ops::encode_images(pixels_flat, widths, heights, format, quality)
        .map_err(|e| JsError::new(&e))
}

/// Convert all embedded JPEG/PNG image XObjects in a PDF to DeviceGray.
///
/// Returns the modified PDF bytes.
#[wasm_bindgen]
pub fn grayscale_pdf(bytes: &[u8]) -> Result<Vec<u8>, JsError> {
    image_ops::grayscale_pdf(bytes).map_err(|e| JsError::new(&e))
}

// ── Linearize (RFC 0042) ─────────────────────────────────────────────────────

/// Rewrite a PDF for "Fast Web View" (linearization).
///
/// Returns the linearized PDF bytes.
#[wasm_bindgen]
pub fn linearize_pdf(bytes: &[u8]) -> Result<Vec<u8>, JsError> {
    linearize::linearize_pdf(bytes).map_err(|e| JsError::new(&e))
}
