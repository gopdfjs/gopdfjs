<<<<<<<< HEAD:.spec/rfc/implemented/0011-crop-pdf.md
---
rfc: "0011"
tier: implemented
verified: false
browser_only: true
tests:
  unit: none
  e2e_playwright: none
---
========
>>>>>>>> 457a45a (Update project documentation and configuration files):.spec/rfc/completed/0011-crop-pdf.md

# RFC 0011 - Crop PDF

- **Status**: Implemented (unverified — see frontmatter `verified`)
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Enable users to visually trim PDF page margins or resize the viewable area.

## 2. Technical Specification
- **Core Library**: `@pdf-lib/pdf-lib`
- **Processing Logic**: 
    - Identify the current `MediaBox` and `CropBox` values.
    - Set new `PDFPage.setMediaBox()` and `PDFPage.setCropBox()` based on input coordinates.
    - Ensure page content is correctly centered or shifted if needed.

## 3. User Experience & Interface
- **Overlay**: An adjustable dashed-line box over the PDF preview.
- **Inputs**: Absolute margin values (Top, Right, Bottom, Left) or aspect ratio presets (e.g., A4, US Letter).
- **Preview**: Dual-view comparison of the original vs cropped page.

## 4. Success Criteria
- [x] Cropping values are accurately reflected in the final output.
- [x] All PDF pages can be cropped simultaneously or individually.
- [x] Links and annotations within the cropped area remain functional.

## 6. Implementation status (2026-06-28)

| Layer | State | Notes |
|-------|-------|-------|
| **L3 product** | **Done** (assumed) | `/tools/crop` on gopdf.fyi; `@gopdfjs/ui` Header nav |
| **L1 WASM** | **N/A** | Per RFC §5 — pdf-lib + canvas JS path ([0057](../0057-rust-wasm-worker-architecture.md)) |
| **Monorepo L3** | **Not in repo** | Tool runner not in tracked git; UI shell only |
| **L2 `packages/tools`** | **Not started** | No orchestration package source |
| **Tests** | **Not done** | No `.spec/e2e/tools/crop.spec.ts` |

**Verdict**: **PARTIAL** — product **Implemented** per RFC §4; monorepo **unverified**. Strict **Done** requires E2E + optional `packages/tools` per [TASK_TRACKING](../../TASK_TRACKING.md).
