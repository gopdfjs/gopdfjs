//! Thin WASM binding layer — delegates to workspace crates (`gopdf-*`).

mod utils;

use js_sys::Function;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(start)]
pub fn init() {
    utils::set_panic_hook();
}

#[wasm_bindgen]
pub fn compress_pdf(
    bytes: &[u8],
    level: &str,
    progress: Option<Function>,
) -> Result<Vec<u8>, JsError> {
    gopdf_compress::compress_pdf(bytes, level, |p| {
        if let Some(cb) = progress.as_ref() {
            let _ = cb.call1(&JsValue::NULL, &JsValue::from_f64(p as f64));
        }
    })
    .map_err(|e| JsError::new(&e))
}

#[wasm_bindgen]
pub fn encode_images(
    pixels_flat: &[u8],
    widths: &[u32],
    heights: &[u32],
    format: &str,
    quality: u8,
) -> Result<Vec<u8>, JsError> {
    gopdf_image::encode_images(pixels_flat, widths, heights, format, quality)
        .map_err(|e| JsError::new(&e))
}

#[wasm_bindgen]
pub fn grayscale_pdf(bytes: &[u8]) -> Result<Vec<u8>, JsError> {
    gopdf_image::grayscale_pdf(bytes).map_err(|e| JsError::new(&e))
}

#[wasm_bindgen]
pub fn linearize_pdf(bytes: &[u8]) -> Result<Vec<u8>, JsError> {
    gopdf_linearize::linearize_pdf(bytes).map_err(|e| JsError::new(&e))
}
