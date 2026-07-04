
# RFC 0002 - Conversion Tools Specification

- **Status**: Completed (umbrella — scope split to RFCs below)
- **Date**: 2026-03-22
- **Closed**: 2026-06-28
- **Author**: Antigravity

## Context

Browser-native conversion: PDF ↔ other formats, images, Office, web, text. Privacy = client-side processing. WASM hybrid per [0057](../0057-rust-wasm-worker-architecture.md) / [0058](../0058-wasm-pdf-library-charter.md).

## Technical goals (original)

1. Browser-native transformation
2. High fidelity where feasible (~80% common files)
3. Web Workers / WASM for heavy batches

## Coverage map (do not re-open 0002 for new work)

| Theme | RFC | Location |
|-------|-----|----------|
| JPG → PDF | [0017](0017-jpg-to-pdf.md) | completed |
| PDF → JPG | [0018](0018-pdf-to-jpg.md) | completed |
| PDF → Word | [0019](../0019-pdf-to-word.md) | active — WASM `pdf_to_docx` per 0019 |
| PDF → Excel | [0024](../0024-pdf-to-excel.md) | active |
| PDF → PPT | [0025](../0025-pdf-to-ppt.md) | active |
| Web → PDF | [0023](../0023-web-to-pdf.md) | active |
| PDF → text/HTML/RTF | [0033](../0033-pdf-to-text-html.md) | active |
| PDF → EPUB/Mobi | [0034](../0034-pdf-to-epub.md) | active |
| Office → PDF | [0036](../0036-office-to-pdf.md) | active |
| Markdown/LaTeX → PDF | [0038](../0038-markdown-latex-to-pdf.md) | active |
| HEIC/WebP → PDF | [0039](../0039-heic-webp-to-pdf.md) | active |
| OCR (scanned → text) | [0020](0020-ocr-pdf.md) | completed — pairs with 0019 for scans |

**Canonical spec** for each tool = its own RFC. This doc does not override 0019 (WASM-first Word export) or 0023 (browser-only constraints).

## Closure

0002 was a **planning umbrella**. Per-tool RFCs exist; umbrella **closed**. New conversion features → RFC **0062+** or amend the child RFC.

## Implementation roll-up (2026-06-28)

| Child | Verdict | § status |
|-------|---------|----------|
| [0017](0017-jpg-to-pdf.md) · [0018](0018-pdf-to-jpg.md) · [0020](0020-ocr-pdf.md) | **PARTIAL** | Each has §6 — product assumed; monorepo L3 not in git |
| [0019](../0019-pdf-to-word.md) | **PARTIAL** | Active RFC §8 — L3 MVP; L1 `pdf_to_docx` not started |
| 0023–0025, 0033–0039 | **NOT STARTED** | Proposed only |

Track detail in [ROADMAP](../ROADMAP.md#shipped-tools-completed) and [TASK_TRACKING](../TASK_TRACKING.md).
