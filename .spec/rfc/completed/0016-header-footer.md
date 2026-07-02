<<<<<<<< HEAD:.spec/rfc/implemented/0016-header-footer.md
---
rfc: "0016"
tier: implemented
verified: false
browser_only: true
tests:
  unit: none
  e2e_playwright: none
---
========
>>>>>>>> 457a45a (Update project documentation and configuration files):.spec/rfc/completed/0016-header-footer.md

# RFC 0016 - Header & Footer

- **Status**: Implemented (unverified — see frontmatter `verified`)
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Enable users to add consistent branding or metadata into the top (header) and bottom (footer) regions of all document pages.

## 2. Technical Specification
- **Core Library**: `pdf-lib`
- **Processing Logic**: 
    - Divide page width into thirds (Left, Center, Right).
    - Insert text or image assets at absolute coordinates relative to the page height (e.g., footer at `y = 20`).
    - Handle page-specific overrides (e.g., skip first page).

## 3. User Experience & Interface
- **Editor**: Multi-field input area with alignment toggles.
- **Styling**: Contextual toolbar for font family, size, and weight.
- **Options**: Start page selector and individual "Skip Header" per page checkbox.

## 4. Success Criteria
- [x] Content is correctly positioned in the margins.
- [x] Consistency across mixed-orientation pages (Portrait/Landscape).
- [x] Export does not cut off header/footer details.

## 6. Implementation status (2026-06-28)

| Layer | State | Notes |
|-------|-------|-------|
| **L3 product** | **Done** (assumed) | `/tools/header-footer` on gopdf.fyi; `@gopdfjs/ui` Header nav |
| **L1 WASM** | **N/A** | Per RFC §5 — pdf-lib JS path ([0057](../0057-rust-wasm-worker-architecture.md)) |
| **Monorepo L3** | **Not in repo** | Tool runner not in tracked git; UI shell only |
| **L2 `packages/tools`** | **Not started** | No orchestration package source |
| **Tests** | **Not done** | No `.spec/e2e/tools/header-footer.spec.ts` |

**Verdict**: **PARTIAL** — product **Implemented** per RFC §4; monorepo **unverified**. Strict **Done** requires E2E + optional `packages/tools` per [TASK_TRACKING](../../TASK_TRACKING.md).
