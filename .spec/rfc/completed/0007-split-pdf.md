<<<<<<<< HEAD:.spec/rfc/implemented/0007-split-pdf.md
---
rfc: "0007"
tier: implemented
verified: false
browser_only: true
tests:
  unit: none
  e2e_playwright: none
---
========
>>>>>>>> 457a45a (Update project documentation and configuration files):.spec/rfc/completed/0007-split-pdf.md

# RFC 0007 - Split PDF

- **Status**: Implemented (unverified — see frontmatter `verified`)
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Allow users to extract specific pages or ranges from a PDF and save them as new documents.

## 2. Technical Specification
- **Core Library**: `@pdf-lib/pdf-lib`
- **Processing Logic**: 
    - Parse the source document.
    - Map user-defined ranges (e.g., `1-3, 5, 10-12`) to page indices.
    - Create new `PDFDocument` instances for each extraction set.
    - Save as a single extracted PDF or multiple individual page files.

## 3. User Experience & Interface
- **Selector**: Visual page scrubber and grid view with checkboxes.
- **Modes**: "Custom Ranges", "Fixed Intervals", "Extract all pages".
- **Download**: Automatic ZIP generation if multiple files are produced.

## 4. Success Criteria
- [x] Users can select specific pages for extraction.
- [x] Extracted documents maintain the original page dimensions.
- [x] High-fidelity preservation of hidden metadata and bookmarks.

## 6. Implementation status (2026-06-28)

| Layer | State | Notes |
|-------|-------|-------|
| **L3 product** | **Done** (assumed) | `/tools/split` on gopdf.fyi; `@gopdfjs/ui` Header nav |
| **L1 WASM** | **N/A** | Per RFC §5 — pdf-lib JS path ([0057](../0057-rust-wasm-worker-architecture.md)) |
| **Monorepo L3** | **Not in repo** | Tool runner not in tracked git; UI shell only |
| **L2 `packages/tools`** | **Not started** | No orchestration package source |
| **Tests** | **Not done** | No `.spec/e2e/tools/split.spec.ts` |

**Verdict**: **PARTIAL** — product **Implemented** per RFC §4; monorepo **unverified**. Strict **Done** requires E2E + optional `packages/tools` per [TASK_TRACKING](../../TASK_TRACKING.md).
