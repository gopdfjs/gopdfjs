<<<<<<<< HEAD:.spec/rfc/implemented/0006-merge-pdf.md
---
rfc: "0006"
tier: implemented
verified: false
browser_only: true
tests:
  unit: none
  e2e_playwright: none
---
========
>>>>>>>> 457a45a (Update project documentation and configuration files):.spec/rfc/completed/0006-merge-pdf.md

# RFC 0006 - Merge PDF

- **Status**: Implemented (unverified — see frontmatter `verified`)
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Enable users to combine multiple PDF documents into a single file while maintaining a custom order.

## 2. Technical Specification
- **Core Library**: `@pdf-lib/pdf-lib`
- **Processing Logic**: 
    - Read source PDF buffers and parse into `PDFDocument` objects.
    - Create a destination `PDFDocument`.
    - Iteratively copy pages using `copyPages()` and `addPage()`.
    - Output is a single `Uint8Array`/`Blob`.

## 3. User Experience & Interface
- **Uploader**: Multi-file drop zone with sortable thumbnails.
- **Controls**: "Merge Now" button, individual page deletion, and drag-and-drop reordering.
- **Preview**: Real-time summary of the final document size and page count.

## 4. Success Criteria
- [x] Multiple PDFs are combined into one.
- [x] Page order matches the user's custom sequence.
- [x] Large files (>50MB) do not crash the browser.

## 5. Rust/WASM Evaluation

**Decision: Stay with JavaScript (pdf-lib). No WASM needed.**

Merging PDFs is an I/O-bound operation, not a compute-bound one. `pdf-lib`'s `copyPages()` reads page object references from source documents and appends them to a destination document — this is primarily pointer manipulation and buffer reads, with no pixel processing or stream recompression. The bottleneck is reading large file buffers from disk/memory, which WASM cannot accelerate.

**If large files (>100 MB) cause memory issues**, the correct fix is to process documents in streaming chunks using `pdf-lib`'s incremental parsing mode, not to add WASM. Consider moving the merge operation to a plain JS Web Worker to avoid main-thread memory pressure on very large inputs.

## 6. Implementation status (2026-06-28)

| Layer | State | Notes |
|-------|-------|-------|
| **L3 product** | **Done** (assumed) | `/tools/merge` on gopdf.fyi; `@gopdfjs/ui` Header nav |
| **L1 WASM** | **N/A** | Per RFC §5 — pdf-lib JS path ([0057](../0057-rust-wasm-worker-architecture.md)) |
| **Monorepo L3** | **Not in repo** | Tool runner not in tracked git; UI shell only |
| **L2 `packages/tools`** | **Not started** | No orchestration package source |
| **Tests** | **Not done** | No `.spec/e2e/tools/merge.spec.ts` |

**Verdict**: **PARTIAL** — product **Implemented** per RFC §4; monorepo **unverified**. Strict **Done** requires E2E + optional `packages/tools` per [TASK_TRACKING](../../TASK_TRACKING.md).
