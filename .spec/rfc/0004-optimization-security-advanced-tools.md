
# RFC 0004 - Optimization, Security & Advanced Tools Specification

- **Status**: Charter (umbrella — scope split to RFCs below)
- **Date**: 2026-03-22
- **Author**: Antigravity

## Context

High-end capabilities: compression, security, OCR, document intelligence, and WASM-accelerated optimization. Privacy = client-side processing. WASM hybrid per [0057](0057-rust-wasm-worker-architecture.md) / [0058](0058-wasm-pdf-library-charter.md).

## Technical goals (original)

1. **Security first** — password and signing operations stay in the browser (zero knowledge).
2. **Accuracy** — OCR and signatures maintain fidelity where feasible.
3. **Performance** — compression and image pipelines balance size vs quality.

## Coverage map (do not re-open 0004 for new work)

| Theme | RFC | Location | Monorepo verdict |
|-------|-----|----------|------------------|
| Compress PDF | [0008](0008-compress-pdf.md) | active | **PARTIAL** — P1 WASM ✅; P2 not started |
| Protect (password) | [0021](completed/0021-protect-pdf.md) | completed | **PARTIAL** — product assumed; L3 not in repo |
| Unlock | [0022](completed/0022-unlock-pdf.md) | completed | **PARTIAL** — same |
| Sign (image field) | [0013](completed/0013-sign-pdf.md) | completed | **PARTIAL** — umbrella in [0003](completed/0003-editing-organization-tools.md) |
| OCR | [0020](completed/0020-ocr-pdf.md) | completed | **PARTIAL** — tesseract.js; not in Header nav |
| Grayscale | [0028](0028-grayscale-pdf.md) | active | **PARTIAL** — WASM stub |
| Web optimize (linearize) | [0042](0042-web-optimize.md) | active | **PARTIAL** — WASM stub |
| Repair xref | [0027](0027-repair-pdf.md) | active | **NOT STARTED** |
| Flatten forms | [0043](0043-flatten-pdf.md) | active | **NOT STARTED** |
| Understand / analyze | [0061](0061-understand-pdf.md) | active | **PARTIAL** — L3 product; L1 `analyze_pdf` planned |
| AI summarizer | [0046](pending/0046-ai-summarizer.md) | pending | **DEFERRED** |
| Chat with PDF | [0047](pending/0047-chat-with-pdf.md) | pending | **DEFERRED** |
| AI translate | [0048](pending/0048-ai-translate-pdf.md) | pending | **DEFERRED** |

**Canonical spec** for each tool = its own RFC. This doc does not override [0008](0008-compress-pdf.md) (WASM compress phases) or [0058](0058-wasm-pdf-library-charter.md) (Object Layer).

## Closure

0004 is a **planning umbrella**. Track progress per child RFC and [ROADMAP](../ROADMAP.md#full-implementation-snapshot-2026-06-28). New optimize/security/advanced features → RFC **0062+** or amend the child RFC. When all children reach **Done** or explicit **Won't do**, move this file to `completed/` with **Closed** status (same pattern as [0002](completed/0002-conversion-tools.md)).
