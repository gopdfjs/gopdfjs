<<<<<<<< HEAD:.spec/rfc/implemented/0017-jpg-to-pdf.md
---
rfc: "0017"
tier: implemented
verified: false
browser_only: true
tests:
  unit: none
  e2e_playwright: none
---
========
>>>>>>>> 457a45a (Update project documentation and configuration files):.spec/rfc/completed/0017-jpg-to-pdf.md

# RFC 0017 - JPG to PDF

- **Status**: Implemented (unverified — see frontmatter `verified`)
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Convert raster image files into search-optimized PDF documents.

## 2. Technical Specification
- **Core Library (product assembly)**: **`pdf-lib`** — 将图像嵌入为 `XObject`、页尺寸与边距（当前产品常见路径）。
- **Core Library (batch encode)**: **`@gopdfjs/pdf-wasm`** — `encodeImages` / `splitEncodedImages`，对 **RGBA 像素缓冲** 做 JPEG/PNG 编码（RFC 0057 / 0058）；**不负责**整册 PDF 拼装（crate 未导出 `imagesToPdf` 前不得写为已实现 API）。
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

**Integration（编码子步骤）**: 使用 **`@gopdfjs/pdf-wasm`**：

```ts
import { encodeImages, splitEncodedImages } from "@gopdfjs/pdf-wasm";

// pixelsFlat: 多页 RGBA 拼接；widths/heights: 每帧宽高
const packed = await encodeImages(pixelsFlat, widths, heights, "jpeg", 92);
const jpegChunks = splitEncodedImages(packed);
// 再将 jpegChunks[i] 交给 pdf-lib 嵌入 PDF（产品层编排）
```

**Scope of Rust work（当前 crate）**: 仅 **像素 → 编码字节**（见 `encode_images`）。**不在**本文档中承诺「单函数输入文件数组、输出完整 PDF」除非 `lib.rs` 已导出对应符号。

## 6. Implementation status (2026-06-28)

| Layer | State | Notes |
|-------|-------|-------|
| **L3 product** | **Done** (assumed) | `/tools/jpg-to-pdf` on gopdf.fyi; `@gopdfjs/ui` Header nav |
| **L1 WASM** | **Partial** | `encode_images` ✅ — pixel → JPEG/PNG bytes in `packages/pdf-wasm` |
| **L1 gap** | **Not in repo** | PDF mux / page assembly = **pdf-lib** (not in repo) |
| **Monorepo L3** | **Not in repo** | End-to-end orchestration not in tracked git |
| **L2 `packages/tools`** | **Not started** | No orchestration package source |
| **Tests** | **Not done** | No `.spec/e2e/tools/jpg-to-pdf.spec.ts` |

**Verdict**: **PARTIAL** — hybrid WASM leg in repo; full tool path unverified in monorepo.
