
# RFC 0003 - Editing & Organization Tools Specification

- **Status**: Completed (umbrella — scope split to RFCs below)
- **Date**: 2026-03-22
- **Closed**: 2026-06-28
- **Author**: Antigravity

## Context

Structure, layout, and annotation tools — merge, split, reorder, crop, sign, watermark, etc. **L3**: `pdf-lib` + canvas; not WASM per [0057](../0057-rust-wasm-worker-architecture.md) / [0058](../0058-wasm-pdf-library-charter.md) matrix.

## Technical goals (original)

1. Non-destructive manipulation
2. Visual interaction (thumbnails, previews)
3. Efficiency on large documents

## Coverage map (do not re-open 0003 for new work)

| Theme | RFC | Location |
|-------|-----|----------|
| Merge | [0006](0006-merge-pdf.md) | completed |
| Split | [0007](0007-split-pdf.md) | completed |
| Rotate | [0009](0009-rotate-pdf.md) | completed |
| Organize pages | [0010](0010-organize-pdf.md) | completed |
| Crop | [0011](0011-crop-pdf.md) | completed |
| Edit (annotations) | [0012](0012-edit-pdf.md) | completed |
| Sign | [0013](0013-sign-pdf.md) | completed |
| Watermark | [0014](0014-watermark-pdf.md) | completed |
| Page numbers | [0015](0015-page-numbers.md) | completed |
| Header & footer | [0016](0016-header-footer.md) | completed |
| Redact / whiteout | [0026](../0026-redact-pdf.md) | active |
| Form filler | [0031](../0031-form-filler.md) | active |
| Native text edit | [0032](../0032-native-text-edit.md) | active |
| N-up | [0030](../0030-n-up-pdf.md) | active |
| Resize pages | [0040](../0040-resize-pdf.md) | active |
| Reverse page order | [0041](../0041-reverse-pdf.md) | active |
| PDF overlay | [0045](../0045-pdf-overlay.md) | active |
| Edit metadata | [0044](../0044-edit-metadata.md) | active |

**Canonical spec** = per-tool RFC. Product pages for 0006–0016 are on gopdf.fyi; verification tracked per child RFC / TASK_TRACKING.

## Closure

0003 was a **planning umbrella**. Per-tool RFCs exist; no unique acceptance criteria remain. New edit/organize features → RFC **0062+** or amend the child RFC.

## Implementation roll-up (2026-06-28)

| Child | Verdict | § status |
|-------|---------|----------|
| [0006](0006-merge-pdf.md)–[0016](0016-header-footer.md) | **PARTIAL** | Each has §6 — product assumed; `pdf-lib` L3 not in monorepo |
| [0026](../0026-redact-pdf.md) · 0030–0032 · 0040–0041 · 0044–0045 | **NOT STARTED** | Proposed only |

Track detail in [ROADMAP](../ROADMAP.md#shipped-tools-completed) and [TASK_TRACKING](../TASK_TRACKING.md).
