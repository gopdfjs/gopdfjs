<<<<<<<< HEAD:.spec/rfc/implemented/0015-page-numbers.md
---
rfc: "0015"
tier: implemented
verified: false
browser_only: true
tests:
  unit: none
  e2e_playwright: none
---
========
>>>>>>>> 457a45a (Update project documentation and configuration files):.spec/rfc/completed/0015-page-numbers.md

# RFC 0015 - Page Numbers

- **Status**: Implemented (unverified — see frontmatter `verified`)
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Automate document collation by inserting sequential or custom numbering on all pages.

## 2. Technical Specification
- **Core Library**: `pdf-lib`
- **Processing Logic**: 
    - Loop through `PDFDocument.getPages()`.
    - Generate numbering string based on format (e.g., `Page 1`).
    - Place text at absolute or relative coordinates (Top/Bottom + Left/Center/Right).

## 3. User Experience & Interface
- **Presets**: Footer-Center, Footer-Right, Header-Right.
- **Format Builder**: Interactive preview of `{n}` and `{m}` (total count) placeholders.
- **Styles**: Font family, size, and color selection.

## 4. Success Criteria
- [x] Page numbers match the actual file order.
- [x] Numbers do not overlap with existing critical page content.
- [x] Start number can be configured (e.g., start at page 5).

## 6. Implementation status (2026-06-28)

| Layer | State | Notes |
|-------|-------|-------|
| **L3 product** | **Done** (assumed) | `/tools/page-numbers` on gopdf.fyi; `@gopdfjs/ui` Header nav |
| **L1 WASM** | **N/A** | Per RFC §5 — pdf-lib JS path ([0057](../0057-rust-wasm-worker-architecture.md)) |
| **Monorepo L3** | **Not in repo** | Tool runner not in tracked git; UI shell only |
| **L2 `packages/tools`** | **Not started** | No orchestration package source |
| **Tests** | **Not done** | No `.spec/e2e/tools/page-numbers.spec.ts` |

**Verdict**: **PARTIAL** — product **Implemented** per RFC §4; monorepo **unverified**. Strict **Done** requires E2E + optional `packages/tools` per [TASK_TRACKING](../../TASK_TRACKING.md).
