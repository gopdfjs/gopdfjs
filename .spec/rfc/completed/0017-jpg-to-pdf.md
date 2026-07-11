
# RFC 0017 - JPG to PDF

- **Status**: Implemented (unverified — see frontmatter `verified`)
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Convert raster image files into search-optimized PDF documents.

## 2. Technical Specification
- **Core Library (product assembly)**: **`pdf-lib`** — 将图像嵌入为 `XObject`、页尺寸与边距（当前产品常见路径）。
- **Core Library (batch encode)**: **`@gopdfjs/engine`** — WASM batch JPEG/PNG via adapter `encodeImages`（engine 内部 `splitEncodedImages` 解析 length-prefixed 输出；**不对外 export**）；**不负责**整册 PDF 拼装。
- **Processing Logic**:
    - （JS）解码用户图片为位图 → 可选调用 WASM 批量编码 → 再用 pdf-lib 写入 PDF 页。
    - 页尺寸：A4 / Auto / Custom；边距与方向由产品层处理。

## 3. User Experience & Interface
- **Batching**: Support for up to 100 images per conversion.
- **Sorting**: Visual reorder via list or grid.
- **Page Settings**: Margin (small, medium, large) and Orientation (Portrait, Landscape).

## 4. Success Criteria
- [x] Image quality is preserved with no forced compression.
- [x] Resulting PDF size is proportional to total image sizes.
- [x] Multiple images are correctly combined into a single multi-page PDF.

## 5. Rust/WASM Acceleration

**Decision: Hybrid（矩阵见 RFC 0057）。**

大批量图片时，主线程 `canvas.toBlob()` 易卡顿；**库已提供** `encode_images`，用于在 Worker 内对 **已展开的 RGBA 帧** 做 JPEG/PNG 编码。整册 PDF 的拼装仍由 **pdf-lib**（或未来 Rust 侧 mux，需单独 RFC）完成。

**Integration（consumer 走 `Gopdf` facade — RFC 0058 §2.4）** — 产品用 `engine.jpgToPdf()`。WASM 批量编码与 blob 拆分由 engine/plugin 内部完成；**不要** import `splitEncodedImages` 或 adapter `encodeImages`。

**Scope of Rust work（当前 crate）**: 仅 **像素 → 编码字节**（见 `encode_images`）。**不在**本文档中承诺「单函数输入文件数组、输出完整 PDF」除非 `lib.rs` 已导出对应符号。

## 6. Implementation status (2026-06-28)

| Surface | Package | Runtime | State | Notes |
|---------|---------|---------|-------|-------|
| **npm** | `@gopdfjs/plugin-struct` | isomorphic | **Partial** | pdf-lib assembly — one pkg |
| **npm** | `@gopdfjs/engine` | isomorphic (target) | **Partial** | `encodeImages` — one pkg with runners |
| **CLI** | `gopdf-cli jpg-to-pdf` | node | **Planned** | thin wrapper over npm above |
| **Rust / WASM** | — | — | Hybrid encode leg | per RFC + [0057](../0057-rust-wasm-engine-architecture.md) |
| **Vitest** | — | — | **Partial** | `packages/struct + packages/engine` |
| **Browser e2e** | — | browser | **Not done** | `apps/demo/e2e/tools/jpg-to-pdf.spec.ts` |
| **ilovepdf** | — | — | out of repo | consumes npm; not OSS gate |

**Verdict**: **PARTIAL** — **one npm pkg by default**; split browser + `-node` **only if** single pkg infeasible ([0058 §2.3](../0058-engine-plugin-charter.md)). CLI wraps npm; no forked logic.
