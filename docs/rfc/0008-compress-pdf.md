# RFC 0008 - Compress PDF

- **Status**: Implemented (Phase 1 — lossless stream recompression); Planned (Phase 2 — image re-encode, blocked on object-level parser, see §3)
- **Author**: Antigravity
- **Date**: 2026-03-22
- **Revision**: 2026-03-22 — rewritten to focus on algorithm contracts and technical blockers; UI/UX removed (not RFC scope)

## 1. Objective

Reduce encoded PDF file size in the browser, without uploading user files. All computation runs in `@gopdfjs/pdf-wasm` via Web Worker (RFC 0057 / 0058).

Two mechanisms at different readiness levels:

1. **Phase 1 (Shipped)** — Lossless FlateDecode stream recompression. Decoded content is bit-for-bit identical to input.
2. **Phase 2 (Planned, blocked)** — Lossy image re-encode + downsampling. Blocked on object-level PDF parser; see §3.

## 2. Phase 1 — Lossless Stream Recompression

### 2.1 Why byte-level scan, not object graph parsing

Phase 1 uses a raw byte scan for `stream\n` / `stream\r\n` markers rather than parsing the PDF xref table and object dictionaries. This is a deliberate choice:

- No dependency on a PDF parser crate — WASM binary stays small.
- Allocation is predictable: one output buffer, no object graph in memory.
- Correctness for the lossless case does not require knowing *which* object a stream belongs to — only whether it is deflate-compressed.

The tradeoff: streams with non-zlib filters (LZW, JBIG2, CCITT, raw JPEG via DCTDecode) are silently passed through. This is acceptable because inflate failure is the detection mechanism — no false positives, no data loss.

### 2.2 Algorithm

```
for each stream body in raw PDF bytes:
    attempt ZlibDecoder inflate
    if inflate succeeds:
        re-deflate at target level
        splice into output buffer
    if inflate fails:
        copy original bytes unchanged
```

Implicit assumptions this algorithm relies on:

- `stream` keyword is preceded by a dictionary and followed by `\n` or `\r\n`.
- `endstream` terminates the stream body.
- The `endstream` keyword does not appear inside a valid deflate stream payload.
- No validation of the `/Filter` dictionary entry — inflate attempt is the sole heuristic.

These assumptions hold for well-formed PDFs. Malformed input may produce output equal in size to input (all inflate attempts fail → all pass-through); it will not corrupt output or panic.

### 2.3 Compression level → `flate2` mapping

| `level` | `flate2::Compression` |
|---|---|
| `"low"` | `Compression::fast()` |
| `"recommended"` | `Compression::default()` |
| `"extreme"` | `Compression::best()` |

Unknown level strings fall through to `default()`.

### 2.4 API contracts

**L1 — Rust function (`compress.rs`)**

```rust
pub fn compress_pdf<F: FnMut(f32)>(
    bytes: &[u8],
    level: &str,
    on_progress: F,
) -> Result<Vec<u8>, String>
```

- `bytes`: borrowed; not mutated; caller retains ownership.
- Returns `Ok(Vec<u8>)`: output ≤ input size for typical Flate-heavy PDFs. May equal input if no deflate streams found or all are already at maximum compression.
- Returns `Err(String)`: only on deflate write failure (OOM in WASM linear memory). Not returned for non-deflate streams — those are pass-through, not errors.
- `on_progress(f)`: `f = 0.0` on entry, monotonically increasing by scan offset fraction, `f = 1.0` before return. Guaranteed to be called with both 0.0 and 1.0.

**L1 → L2 — wasm-bindgen export (`lib.rs`)**

```rust
#[wasm_bindgen]
pub fn compress_pdf(
    bytes: &[u8],
    level: &str,
    progress: Option<Function>,
) -> Result<Vec<u8>, JsError>
```

- `progress`: optional JS callback `(fraction: number) => void`. Pass `undefined` to skip.
- `JsError` wraps the `String` from inner function.

**L2 — Worker protocol (`worker.ts`)**

Host → Worker:
```ts
{ id: number, op: "compress", payload: { bytes: Uint8Array, level: string, reportProgress?: boolean } }
// bytes.buffer is in the transfer list — zero-copy
```

Worker → Host:
```ts
{ id: number, ok: true,  progress: number }      // 0.0–1.0, emitted if reportProgress=true
{ id: number, ok: true,  result: Uint8Array }     // result.buffer transferred
{ id: number, ok: false, error: string }
```

**L3 — Host API (`index.ts`)**

```ts
const out = await compressPdf(inputBytes, "recommended", (f) => { /* 0–1 */ });
// inputBytes.buffer is transferred; do not reuse after this call
```

### 2.5 Known limitations of Phase 1

- Only ZlibDecoder (RFC 1950 zlib wrapper over DEFLATE) is attempted. Raw DEFLATE, LZW, JBIG2, CCITT, DCTDecode image streams are passed through unchanged.
- Does not rewrite `/Length` dictionary entries — not needed because the byte-scan approach preserves the exact structure around stream bodies. Downstream PDF parsers read `endstream` as the terminator, not `/Length`, for stream body extraction.
- Output size is not guaranteed smaller than input on PDFs that are already maximally compressed.

## 3. Phase 2 — Lossy Image Re-encode (Planned, Blocked)

### 3.1 Technical blocker

Phase 2 must replace image XObject stream bytes with re-encoded lower-quality versions. This requires:

1. Parsing the xref table to locate objects.
2. Reading `/ColorSpace`, `/BitsPerComponent`, `/Width`, `/Height` from the object dictionary.
3. Replacing stream bytes **and rewriting `/Length`** in the dictionary.

**The byte-scan approach from Phase 1 cannot do this.** Step 3 requires modifying dictionary entries adjacent to the stream — impossible without understanding the surrounding object structure.

An object-level PDF parser must be added. The leading candidate is `lopdf`. This has a direct cost: `lopdf` adds significant Rust code to the WASM binary. The Phase 1 binary currently targets `< 1 MB gzip` (RFC 0057 §9). Adding `lopdf` must be benchmarked against that target before committing.

**Decision gate**: measure `lopdf` + Phase 2 binary size before writing Phase 2 code. If it blows the budget, evaluate alternatives (partial parser, feature-gated separate WASM module).

### 3.2 Algorithm (target, not yet implemented)

```
parse xref → locate image XObjects with /Subtype /Image
for each XObject:
    read /Filter, /ColorSpace, /BitsPerComponent, /Width, /Height
    decode stream bytes per /Filter
    load as DynamicImage (image crate, already in Cargo.toml)
    if dimensions exceed quality-derived DPI ceiling:
        downsample
    re-encode as JPEG at quality-derived encode quality
    replace stream bytes in output buffer
    rewrite /Length
```

### 3.3 `quality` parameter (target, not yet wired)

Single integer `1–100` (JPEG quality semantics). Drives both encode quality and downsampling ceiling. Exact DPI ceiling constants must be determined by benchmark and locked in Rust unit tests before shipping — not defined here to avoid specifying unvalidated numbers.

Default: 80 (balance of size reduction and visual fidelity for typical documents).

### 3.4 Worker op change required before implementation

Phase 2 either extends the existing `compress` op payload with an optional `quality` field, or introduces a new `compress_images` op. **This decision must be recorded in RFC 0057 §5.2 before any code is written.** Do not add undocumented Worker ops.

### 3.5 Cargo.toml change required

Add `lopdf` (or chosen alternative) as an optional dependency behind a Cargo feature flag. This allows Phase 1 builds to ship without the parser overhead while Phase 2 is in development.

## 4. Success Criteria

### Phase 1

- [x] Round-trip correctness: `inflate(output_stream) == inflate(input_stream)` for all FlateDecode streams.
- [x] Non-deflate stream bodies pass through byte-for-byte unchanged.
- [x] Progress monotonicity: all reported values non-decreasing; 0.0 and 1.0 always emitted.
- [ ] 10 MB Flate-heavy reference PDF: output smaller than input; processing time < 5 s in production WASM build.
- [ ] 200 MB input: Worker does not OOM; chunked strategy defined if needed.

### Phase 2

- [ ] WASM binary size with `lopdf`: measured against RFC 0057 §9 budget before implementation proceeds.
- [ ] At `quality=80`: typical image-heavy PDF shows measurable size reduction; PDF opens without error in Adobe Reader, Chrome, and pdf.js.
- [ ] `/Length` rewrite: verified correct on 10 reference PDFs with mixed image types.

## 5. Out of Scope

- UI controls, route names, progress bar design — product concern, not RFC scope.
- Encryption / decryption — RFC 0021 (SubtleCrypto per RFC 0057 §2).
- Server-side compression — data does not leave the browser.
- Stream filters other than FlateDecode (Phase 1) and DCTDecode/image XObjects (Phase 2).
