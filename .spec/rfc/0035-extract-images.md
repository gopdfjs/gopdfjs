
# RFC 0035 - Extract Images from PDF

- **Status**: Proposed — **product unconfirmed in monorepo** (see §5)
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Identify and extract all raster image assets embedded within a PDF document at their original resolution.

## 2. Technical Specification
- **Core Library**: `pdfjs-dist`
- **Processing Logic**: 
    - Scan the PDF object graph for `XObject` types where `Subtype` is `/Image`.
    - Decode the raw pixel data (DCT, Flate, etc.) into standard image buffers (PNG/JPG).
    - Save images with sequential naming (e.g., `image_001.jpg`).

## 3. User Experience & Interface
- **Gallery View**: Real-time display of images as they are discovered.
- **Bulk Action**: "Download All as ZIP" or individual file interaction.

## 4. Verification & Success Criteria
- [ ] Images are extracted at their original DPI, not rendered DPI.
- [ ] Hidden or tiny icons are correctly filtered or included based on user preference.
- [ ] Support for multiple image formats (JPG, PNG, TIFF, JP2).

## 5. Implementation status (2026-06-28)

| Surface | Package | Runtime | State | Notes |
|---------|---------|---------|-------|-------|
| **npm** | `@gopdfjs/plugin-extract` | isomorphic (target) | **Not started** | image extract — one pkg; pdfjs inside; split only if Node blocked |
| **CLI** | `gopdf-cli extract-images` | node | **Out of repo** | [`gopdf-cli`](https://github.com/gopdfjs/gopdf-cli) — not OSS gate |
| **Rust / WASM** | — | — | N/A (pdfjs) | per RFC + [0057](completed/0057-rust-wasm-engine-architecture.md) |
| **Vitest** | — | — | **Partial** | `packages/plugin-extract` |
| **Browser e2e** | — | browser | **Not done** | `apps/demo/e2e/tools/extract-images.spec.ts` |
| **ilovepdf** | — | — | out of repo | consumes npm; not OSS gate |

**Verdict**: **NOT STARTED** — OSS gate only ([`docs/PUBLISHING.md`](../../docs/PUBLISHING.md) · [`docs/PUBLISHING.md`](../../docs/PUBLISHING.md)). **Not** gated on `gopdf-cli` (separate repo).
