<<<<<<<< HEAD:.spec/rfc/implemented/0012-edit-pdf.md
---
rfc: "0012"
tier: implemented
verified: false
browser_only: true
tests:
  unit: none
  e2e_playwright: none
---
========
>>>>>>>> 457a45a (Update project documentation and configuration files):.spec/rfc/completed/0012-edit-pdf.md

# RFC 0012 - Edit PDF

- **Status**: Implemented (unverified — see frontmatter `verified`)
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Provide a browser-based annotation layer for adding text, images, and shapes onto existing PDF pages.

## 2. Technical Specification
- **Core Library**: `pdf-lib`
- **Processing Logic**: 
    - Render the PDF page using `pdf.js` for selection/editing.
    - Track text coordinates and objects on an HTML5 canvas.
    - Composite the canvas objects onto the PDF stream using `drawText()`, `drawImage()`, and `drawRectangle()`.

## 3. User Experience & Interface
- **Toolbar**: Text tool, image uploader, shape tool (circle, rectangle), and line tool.
- **Canvas**: Interactive select-and-move workspace with undo/redo support.
- **Properties**: Font picker, font size, stroke color, and opacity controls.

## 4. Success Criteria
- [x] User-added elements are visible in the output PDF.
- [x] Text remains editable as an object within the PDF (if supported by the viewer).
- [x] Image transparency (PNG) is preserved during embedding.

## 6. Implementation status (2026-06-28)

| Layer | State | Notes |
|-------|-------|-------|
| **L3 product** | **Done** (assumed) | `/tools/edit` on gopdf.fyi; `@gopdfjs/ui` Header nav |
| **L1 WASM** | **N/A** | Per RFC §5 — pdf-lib + canvas JS path ([0057](../0057-rust-wasm-worker-architecture.md)) |
| **Monorepo L3** | **Not in repo** | Tool runner not in tracked git; UI shell only |
| **L2 `packages/tools`** | **Not started** | No orchestration package source |
| **Tests** | **Not done** | No `.spec/e2e/tools/edit.spec.ts` |

**Verdict**: **PARTIAL** — product **Implemented** per RFC §4; monorepo **unverified**. Strict **Done** requires E2E + optional `packages/tools` per [TASK_TRACKING](../../TASK_TRACKING.md).
