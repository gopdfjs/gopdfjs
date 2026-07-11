
# RFC 0018 - PDF to JPG

- **Status**: Implemented (unverified — see frontmatter `verified`)
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Facilitate high-fidelity rendering of PDF pages into JPEG/PNG image formats.

## 2. Technical Specification
- **Core Library**: `pdfjs-dist`
- **Processing Logic**: 
    - Instantiate `pdfjsLib.getDocument()` and load page buffer.
    - Scale canvas output to target DPI (e.g., 200/300 DPI).
    - Stream output slices to avoid UI thread blocking.
    - Export using `canvas.toBlob()` or `toDataURL()`.

## 3. User Experience & Interface
- **Settings**: DPI picker (150, 300, 600) and Format selector (JPG, PNG).
- **Download**: Instant individual image download or bulk ZIP archive.

## 4. Success Criteria
- [x] Text rendering is sharp with correct anti-aliasing.
- [x] Support for highly complex PDFs with many vector paths.
- [x] Consistent color space mapping from PDF (CMYK/RGB) to JPG.

## 5. Rust/WASM Acceleration

**Decision: Hybrid（矩阵见 RFC 0057）。**

**渲染**必须保留 **pdfjs**（Canvas / `ImageData`）。**出图编码**应使用 **`@gopdfjs/engine`** 的 **`encodeImages`**，避免大批量高 DPI 下依赖 `canvas.toBlob()`。

**Split responsibility**:
1. **pdfjs (JS)** — 每页渲染到 `ImageData`（RGBA）。
2. **Rust/WASM Worker** — `encodeImages(...)`；engine 内部 `splitEncodedImages` 拆成多份 JPEG/PNG 字节（不对外 export）。

**Consumer API（RFC 0058 §2.6）** — 使用 `engine.pdfToJpeg(bytes, { scale, quality })`（engine 内部 pdf.js + canvas + JPEG 编码；WASM blob 拆分亦在 engine 内部）。

**Scope of Rust work（当前 crate）**: 仅 RGBA → 编码流；**不包含**「从 PDF 直接光栅化」（仍由 pdfjs 完成）。

## 6. Implementation status (2026-06-28)

| Surface | Package | Runtime | State | Notes |
|---------|---------|---------|-------|-------|
| **npm** | `@gopdfjs/engine` | isomorphic (target) | **Partial** | pdf.js render via adapter canvas (`renderPage.ts` internal) + WASM encode |
| **CLI** | `gopdf-cli pdf-to-jpg` | node | **Out of repo** | [`gopdf-cli`](https://github.com/gopdfjs/gopdf-cli) — not OSS gate |
| **Rust / WASM** | — | — | Hybrid | per RFC + [0057](../0057-rust-wasm-engine-architecture.md) |
| **Vitest** | — | — | **Partial** | `packages/engine (renderPage.ts internal)` |
| **Browser e2e** | — | browser | **Done** | `apps/demo/e2e/tools/all-tools.spec.ts` |
| **ilovepdf** | — | — | out of repo | consumes npm; not OSS gate |

**Verdict**: **PARTIAL** — OSS gate only ([0058 §3.5](../0058-engine-plugin-charter.md) · [`docs/PUBLISHING.md`](../../docs/PUBLISHING.md)). **Not** gated on `gopdf-cli` (separate repo).
