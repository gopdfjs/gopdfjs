<<<<<<<< HEAD:.spec/rfc/implemented/0018-pdf-to-jpg.md
---
rfc: "0018"
tier: implemented
verified: false
browser_only: true
tests:
  unit: none
  e2e_playwright: none
---
========
>>>>>>>> 457a45a (Update project documentation and configuration files):.spec/rfc/completed/0018-pdf-to-jpg.md

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

**渲染**必须保留 **pdfjs**（Canvas / `ImageData`）。**出图编码**应使用 **`@gopdfjs/pdf-wasm`** 的 **`encodeImages`**，避免大批量高 DPI 下依赖 `canvas.toBlob()`。

**Split responsibility**:
1. **pdfjs (JS)** — 每页渲染到 `ImageData`（RGBA）。
2. **Rust/WASM Worker** — `encodeImages(pixelsFlat, widths, heights, format, quality)`，再用 **`splitEncodedImages`** 拆成多份 JPEG/PNG 字节。

```ts
import { encodeImages, splitEncodedImages } from "@gopdfjs/pdf-wasm";

const packed = await encodeImages(pixelsFlat, widths, heights, "jpeg", 92);
const jpegChunks = splitEncodedImages(packed);
```

**Scope of Rust work（当前 crate）**: 仅 RGBA → 编码流；**不包含**「从 PDF 直接光栅化」（仍由 pdfjs 完成）。

## 6. Implementation status (2026-06-28)

| Layer | State | Notes |
|-------|-------|-------|
| **L3 product** | **Done** (assumed) | `/tools/pdf-to-jpg` on gopdf.fyi; `@gopdfjs/ui` Header nav |
| **L1 WASM** | **Partial** | `encode_images` ✅ — batch JPEG/PNG encode after render |
| **L1 gap** | **Not in repo** | pdfjs page render → `ImageData` (not in repo) |
| **Monorepo L3** | **Not in repo** | End-to-end orchestration not in tracked git |
| **L2 `packages/tools`** | **Not started** | No orchestration package source |
| **Tests** | **Not done** | No `.spec/e2e/tools/pdf-to-jpg.spec.ts` |

**Verdict**: **PARTIAL** — hybrid WASM leg in repo; full tool path unverified in monorepo.
