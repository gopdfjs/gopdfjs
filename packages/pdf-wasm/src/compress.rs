use flate2::{write::ZlibEncoder, Compression};
use std::io::Write;

/// Compression preset → flate2 level mapping.
fn compression_level(level: &str) -> Compression {
    match level {
        "extreme" => Compression::best(),
        "low" => Compression::fast(),
        _ => Compression::default(), // "recommended"
    }
}

/// Re-compress all FlateDecode streams found in the raw PDF bytes.
///
/// Strategy:
///   1. Scan for FlateDecode stream markers in the raw bytes.
///   2. Inflate each stream back to raw bytes.
///   3. Re-deflate at the target compression level.
///   4. Splice the re-compressed stream back into the output buffer.
///
/// This is a byte-level operation — it does not parse the full PDF object graph,
/// which keeps the implementation simple and allocation-predictable.
///
/// `on_progress` receives **0.0** at start, monotonic values in
/// `(0, 1)` based on scan offset, and **1.0** before success return — never silent when the host
/// wires a JS callback (see Worker + `reportProgress`).
pub fn compress_pdf<F: FnMut(f32)>(
    bytes: &[u8],
    level: &str,
    mut on_progress: F,
) -> Result<Vec<u8>, String> {
    let compression = compression_level(level);
    let len = bytes.len().max(1) as f32;

    let mut report = |cursor: usize| {
        on_progress((cursor as f32 / len).clamp(0.0, 1.0));
    };

    report(0);

    // Locate every real `stream` keyword (not the `stream` inside `endstream`) and `endstream`.
    // Read only from `bytes` — no full-buffer clone (important for 200MB+ inputs).
    let mut i = 0;
    let mut result: Vec<u8> = Vec::with_capacity(bytes.len());

    while i < bytes.len() {
        if let Some(stream_start) = find_stream_start(bytes, i) {
            let header_end = stream_start.end;
            result.extend_from_slice(&bytes[i..header_end]);

            let rest = &bytes[header_end..];
            if let Some(end_offset) = find_bytes(rest, b"endstream") {
                let raw_stream = &rest[..end_offset];

                match inflate_stream(raw_stream) {
                    Ok(inflated) => {
                        let recompressed = deflate_stream(&inflated, compression)?;
                        result.extend_from_slice(&recompressed);
                    }
                    Err(_) => {
                        // Not a deflated stream (e.g. raw image data) — pass through unchanged
                        result.extend_from_slice(raw_stream);
                    }
                }

                i = header_end + end_offset;
                report(i);
            } else {
                result.extend_from_slice(&bytes[i..]);
                on_progress(1.0);
                return Ok(result);
            }
        } else {
            result.extend_from_slice(&bytes[i..]);
            break;
        }
    }

    on_progress(1.0);
    Ok(result)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

struct StreamBounds {
    /// Byte offset of the first byte AFTER the "stream\n" or "stream\r\n" marker.
    end: usize,
}

/// Find the next `stream\n` / `stream\r\n` keyword, skipping the substring **`stream` inside
/// `endstream`**, which would otherwise be a false positive.
fn find_stream_start(bytes: &[u8], from: usize) -> Option<StreamBounds> {
    let marker_lf = b"stream\n";
    let marker_crlf = b"stream\r\n";
    let slice = &bytes[from..];
    let mut offset = 0usize;

    while offset < slice.len() {
        let rel_crlf = find_bytes(&slice[offset..], marker_crlf).map(|p| offset + p);
        let rel_lf = find_bytes(&slice[offset..], marker_lf).map(|p| offset + p);

        let (rel_pos, mlen) = match (rel_crlf, rel_lf) {
            (Some(a), Some(b)) if a < b => (a, marker_crlf.len()),
            (Some(a), Some(b)) if b < a => (b, marker_lf.len()),
            (Some(a), Some(_b)) => (a, marker_crlf.len()),
            (Some(a), None) => (a, marker_crlf.len()),
            (None, Some(b)) => (b, marker_lf.len()),
            (None, None) => return None,
        };

        let abs_stream = from + rel_pos;
        if abs_stream >= 3 && bytes[abs_stream - 3..abs_stream] == *b"end" {
            offset = rel_pos + 1;
            continue;
        }

        return Some(StreamBounds {
            end: abs_stream + mlen,
        });
    }

    None
}

fn find_bytes(haystack: &[u8], needle: &[u8]) -> Option<usize> {
    if needle.is_empty() || haystack.len() < needle.len() {
        return None;
    }
    haystack
        .windows(needle.len())
        .position(|w| w == needle)
}

fn inflate_stream(data: &[u8]) -> Result<Vec<u8>, String> {
    use flate2::read::ZlibDecoder;
    use std::io::Read;

    let mut decoder = ZlibDecoder::new(data);
    let mut out = Vec::new();
    decoder
        .read_to_end(&mut out)
        .map_err(|e| format!("inflate error: {e}"))?;
    Ok(out)
}

fn deflate_stream(data: &[u8], level: Compression) -> Result<Vec<u8>, String> {
    let mut encoder = ZlibEncoder::new(Vec::new(), level);
    encoder
        .write_all(data)
        .map_err(|e| format!("deflate write error: {e}"))?;
    encoder
        .finish()
        .map_err(|e| format!("deflate finish error: {e}"))
}

#[cfg(test)]
mod tests {
    use super::*;
    use flate2::read::ZlibDecoder;
    use std::io::{Read, Write};

    fn zlib_payload(data: &[u8]) -> Vec<u8> {
        let mut enc = ZlibEncoder::new(Vec::new(), Compression::default());
        enc.write_all(data).unwrap();
        enc.finish().unwrap()
    }

    fn inflate(z: &[u8]) -> Vec<u8> {
        let mut d = ZlibDecoder::new(z);
        let mut out = Vec::new();
        d.read_to_end(&mut out).unwrap();
        out
    }

    /// 构造最小 `stream`…`endstream` 片段，中间为合法 zlib 包。
    fn pdf_with_zlib_stream(stream_header: &[u8], payload: &[u8], tail: &[u8]) -> Vec<u8> {
        let mut pdf = Vec::new();
        pdf.extend_from_slice(b"%PDF-1.4\n");
        pdf.extend_from_slice(stream_header);
        pdf.extend_from_slice(&zlib_payload(payload));
        pdf.extend_from_slice(b"\nendstream\n");
        pdf.extend_from_slice(tail);
        pdf
    }

    #[test]
    fn no_stream_marker_copies_input() {
        let pdf = b"%PDF-1.4\n% small doc without streams\n%%EOF\n";
        let out = compress_pdf(pdf, "recommended", |_| {}).unwrap();
        assert_eq!(out.as_slice(), pdf.as_slice());
    }

    #[test]
    fn zlib_stream_preserves_inflated_payload_after_roundtrip() {
        let payload: Vec<u8> = "The quick brown fox jumps over the lazy dog. "
            .repeat(8)
            .into_bytes();
        let pdf = pdf_with_zlib_stream(b"stream\n", &payload, b"%%EOF\n");
        for level in ["low", "recommended", "extreme"] {
            let out = compress_pdf(&pdf, level, |_| {}).unwrap();
            let start = find_bytes(&out, b"stream\n").expect("stream") + b"stream\n".len();
            let rel = find_bytes(&out[start..], b"endstream").expect("endstream");
            let body = &out[start..start + rel];
            let round = inflate(body);
            assert_eq!(
                round, payload,
                "inflated stream body should match original payload (level={level})"
            );
        }
    }

    #[test]
    fn non_zlib_body_passes_through_unchanged() {
        let mut pdf = Vec::new();
        pdf.extend_from_slice(b"%PDF-1.4\nstream\n");
        pdf.extend_from_slice(b"plain-bytes-not-zlib");
        pdf.extend_from_slice(b"\nendstream\n%%EOF\n");
        let out = compress_pdf(&pdf, "recommended", |_| {}).unwrap();
        assert_eq!(out.as_slice(), pdf.as_slice());
    }

    #[test]
    fn progress_reports_zero_and_one_and_monotonic() {
        let pdf = pdf_with_zlib_stream(b"stream\n", b"hello", b"%%EOF\n");
        let mut samples: Vec<f32> = Vec::new();
        compress_pdf(&pdf, "recommended", |p| samples.push(p)).unwrap();
        assert_eq!(samples.first().copied(), Some(0.0));
        assert_eq!(samples.last().copied(), Some(1.0));
        for w in samples.windows(2) {
            assert!(
                w[1] + f32::EPSILON >= w[0],
                "progress should be non-decreasing: {:?}",
                samples
            );
        }
    }

    #[test]
    fn stream_crlf_marker_supported() {
        let payload = b"x".repeat(64);
        let pdf = pdf_with_zlib_stream(b"stream\r\n", &payload, b"%%EOF\n");
        let out = compress_pdf(&pdf, "recommended", |_| {}).unwrap();
        let hdr = find_bytes(&out, b"stream\r\n")
            .map(|p| (p, b"stream\r\n".len()))
            .or_else(|| find_bytes(&out, b"stream\n").map(|p| (p, b"stream\n".len())))
            .expect("stream keyword with EOL");
        let pos = hdr.0 + hdr.1;
        let rel = find_bytes(&out[pos..], b"endstream").unwrap();
        assert_eq!(inflate(&out[pos..pos + rel]), payload);
    }
}
