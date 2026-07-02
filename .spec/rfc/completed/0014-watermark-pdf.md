<<<<<<<< HEAD:.spec/rfc/implemented/0014-watermark-pdf.md
---
rfc: "0014"
tier: implemented
verified: false
browser_only: true
tests:
  unit: none
  e2e_playwright: none
---
========
>>>>>>>> 457a45a (Update project documentation and configuration files):.spec/rfc/completed/0014-watermark-pdf.md

# RFC 0014 - Watermark PDF

- **Status**: Implemented (unverified — see frontmatter `verified`)
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Protect intellectual property by overlaying semi-transparent text or branding images across PDF pages.

## 2. Technical Specification
- **Core Library**: `pdf-lib`
- **Processing Logic**: 
    - Set the `graphicsState` for opacity.
    - Calculate placement (Center, Mosaic/Grid, or manual coordinates).
    - Draw the watermark onto the top layer of each selected page.

## 3. User Experience & Interface
- **Inputs**: Custom text string or direct file upload for logo watermarks.
- **Options**: Opacity slider (0-100%), Rotation angle, and specific page range selection.

## 4. Success Criteria
- [x] Watermark appears on every specified page.
- [x] Opacity level allows for readability of the underlying content.
- [x] Logo watermarks maintain their original aspect ratio.

## 6. Implementation status (2026-06-28)

| Layer | State | Notes |
|-------|-------|-------|
| **L3 product** | **Done** (assumed) | `/tools/watermark` on gopdf.fyi; `@gopdfjs/ui` Header nav |
| **L1 WASM** | **N/A** | Per RFC §5 — pdf-lib JS path ([0057](../0057-rust-wasm-worker-architecture.md)) |
| **Monorepo L3** | **Not in repo** | Tool runner not in tracked git; UI shell only |
| **L2 `packages/tools`** | **Not started** | No orchestration package source |
| **Tests** | **Not done** | No `.spec/e2e/tools/watermark.spec.ts` |

**Verdict**: **PARTIAL** — product **Implemented** per RFC §4; monorepo **unverified**. Strict **Done** requires E2E + optional `packages/tools` per [TASK_TRACKING](../../TASK_TRACKING.md).
