use image::{DynamicImage, GrayImage, ImageFormat, RgbaImage};
use std::io::Cursor;

// ── encode_images (RFC 0017 JPG→PDF, RFC 0018 PDF→JPG) ───────────────────────

/// Encode multiple raw RGBA pixel buffers to JPEG or PNG.
///
/// Input layout:
///   - `pixels_flat`: all frames' RGBA bytes concatenated (frame_i starts at
///     sum(widths[0..i] * heights[0..i] * 4))
///   - `widths[i]`, `heights[i]`: pixel dimensions of frame i
///   - `format`: "jpeg" | "png"
///   - `quality`: 1–100 for JPEG; ignored for PNG
///
/// Output layout (length-prefixed so the host can split frames):
///   [u32 big-endian length][encoded bytes] repeated for each frame
pub fn encode_images(
    pixels_flat: &[u8],
    widths: &[u32],
    heights: &[u32],
    format: &str,
    quality: u8,
) -> Result<Vec<u8>, String> {
    if widths.len() != heights.len() {
        return Err("widths and heights arrays must have the same length".into());
    }

    let img_format = match format {
        "jpeg" | "jpg" => ImageFormat::Jpeg,
        "png" => ImageFormat::Png,
        other => return Err(format!("unsupported format: {other}")),
    };

    let mut out: Vec<u8> = Vec::new();
    let mut pixel_offset = 0usize;

    for i in 0..widths.len() {
        let w = widths[i];
        let h = heights[i];
        let pixel_count = (w as usize) * (h as usize) * 4;

        let frame_pixels = pixels_flat
            .get(pixel_offset..pixel_offset + pixel_count)
            .ok_or_else(|| format!("pixel buffer too short at frame {i}"))?;
        pixel_offset += pixel_count;

        let rgba = RgbaImage::from_raw(w, h, frame_pixels.to_vec())
            .ok_or_else(|| format!("invalid pixel data for frame {i}"))?;
        let img = DynamicImage::ImageRgba8(rgba);

        let mut encoded: Vec<u8> = Vec::new();
        let mut cursor = Cursor::new(&mut encoded);

        if img_format == ImageFormat::Jpeg {
            // Convert to RGB (JPEG does not support alpha)
            let rgb = img.to_rgb8();
            let mut jpeg_out: Vec<u8> = Vec::new();
            let mut jpeg_cursor = Cursor::new(&mut jpeg_out);
            let mut encoder =
                image::codecs::jpeg::JpegEncoder::new_with_quality(&mut jpeg_cursor, quality);
            encoder
                .encode_image(&rgb)
                .map_err(|e| format!("JPEG encode error at frame {i}: {e}"))?;
            drop(jpeg_cursor);
            // Write 4-byte big-endian length prefix
            let len = jpeg_out.len() as u32;
            out.extend_from_slice(&len.to_be_bytes());
            out.extend_from_slice(&jpeg_out);
        } else {
            img.write_to(&mut cursor, img_format)
                .map_err(|e| format!("PNG encode error at frame {i}: {e}"))?;
            drop(cursor);
            let len = encoded.len() as u32;
            out.extend_from_slice(&len.to_be_bytes());
            out.extend_from_slice(&encoded);
        }
    }

    Ok(out)
}

// ── grayscale_pdf (RFC 0028) ──────────────────────────────────────────────────

/// Convert all embedded JPEG/PNG image streams in a PDF to DeviceGray.
///
/// Strategy:
///   Scan raw PDF bytes for JPEG SOI markers (0xFF 0xD8) and PNG signatures
///   embedded inside stream sections. Decode each, convert to grayscale,
///   re-encode, and splice back into the output buffer.
///
/// Limitation: This handles inline image data only. Color space declarations
/// in the PDF's page content stream (for vector graphics / text) are not
/// modified here — that pass is handled by pdf-lib on the JS side.
pub fn grayscale_pdf(bytes: &[u8], ) -> Result<Vec<u8>, String> {
    let mut output = bytes.to_vec();

    // Process JPEG images embedded in streams
    output = convert_embedded_images(&output, ImageFormat::Jpeg)?;
    // Process PNG images embedded in streams
    output = convert_embedded_images(&output, ImageFormat::Png)?;

    Ok(output)
}

fn convert_embedded_images(bytes: &[u8], format: ImageFormat) -> Result<Vec<u8>, String> {
    let (magic_start, magic_end) = match format {
        ImageFormat::Jpeg => (
            &[0xFF_u8, 0xD8][..],  // SOI
            &[0xFF_u8, 0xD9][..],  // EOI
        ),
        ImageFormat::Png => (
            &[0x89_u8, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A][..], // PNG sig
            // PNG ends with IEND chunk: length(0)+IEND+CRC
            &[0x00_u8, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82][..],
        ),
        _ => return Ok(bytes.to_vec()),
    };

    let mut result: Vec<u8> = Vec::with_capacity(bytes.len());
    let mut i = 0usize;

    while i < bytes.len() {
        if bytes[i..].starts_with(magic_start) {
            // Find the end marker
            let search_from = i + magic_start.len();
            if let Some(end_rel) = find_bytes(&bytes[search_from..], magic_end) {
                let img_end = search_from + end_rel + magic_end.len();
                let img_bytes = &bytes[i..img_end];

                // Decode → convert → re-encode
                match convert_to_gray(img_bytes, format) {
                    Ok(gray_bytes) => {
                        result.extend_from_slice(&gray_bytes);
                        i = img_end;
                        continue;
                    }
                    Err(_) => {
                        // Could not convert (e.g. already grayscale) — pass through
                    }
                }
            }
        }
        result.push(bytes[i]);
        i += 1;
    }

    Ok(result)
}

fn convert_to_gray(bytes: &[u8], format: ImageFormat) -> Result<Vec<u8>, String> {
    let img = image::load_from_memory_with_format(bytes, format)
        .map_err(|e| format!("decode error: {e}"))?;

    let gray: GrayImage = img.to_luma8();
    let gray_img = DynamicImage::ImageLuma8(gray);

    let mut out: Vec<u8> = Vec::new();
    let mut cursor = Cursor::new(&mut out);
    gray_img
        .write_to(&mut cursor, format)
        .map_err(|e| format!("encode error: {e}"))?;
    drop(cursor);
    Ok(out)
}

fn find_bytes(haystack: &[u8], needle: &[u8]) -> Option<usize> {
    if needle.is_empty() || haystack.len() < needle.len() {
        return None;
    }
    haystack.windows(needle.len()).position(|w| w == needle)
}
