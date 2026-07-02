<<<<<<<< HEAD:.spec/rfc/proposed/0035-extract-images.md
---
rfc: "0035"
tier: proposed
verified: false
browser_only: true
tests:
  unit: none
  e2e_playwright: none
---
========
>>>>>>>> 457a45a (Update project documentation and configuration files):.spec/rfc/0035-extract-images.md

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

| Layer | State | Notes |
|-------|-------|-------|
| **L3 product** | **Unknown** | Not listed in `@gopdfjs/ui` Header (16-tool nav); may exist on gopdf.fyi homepage — verify manually |
| **Monorepo** | **Not started** | No `extract-images` route/tests |
| **WASM** | **Not planned** | pdfjs L3 per §2; no `pdf-wasm` op |

**Verdict**: **NOT STARTED** in monorepo until product link confirmed. If live on gopdf.fyi, update Status → **Partial (L3)** and add E2E when L3 code is in repo.
