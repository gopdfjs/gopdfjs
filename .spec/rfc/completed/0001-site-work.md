
# RFC 0001 - Defining Site Work for iLovePDF Clone

- **Status**: Completed (umbrella — scope split to RFCs below)
- **Date**: 2026-03-22
- **Closed**: 2026-06-28
- **Author**: Antigravity

## Context

Browser-only PDF tool site. **Host stack**: `pdf-lib` + `pdfjs-dist` for structure/render; compute-heavy work in `@gopdfjs/pdf-wasm` (RFC [0057](../0057-rust-wasm-worker-architecture.md), [0058](../0058-wasm-pdf-library-charter.md)). Product UI: `site/` (Vite + React); shared UI `@gopdfjs/ui`; i18n `@gopdfjs/i18n`.

## Objectives (original)

1. Premium UI/UX
2. Functional depth per tool
3. Site integrity (nav, errors)
4. Performance & SEO

## Coverage map (do not re-open 0001 for new work)

| Theme | Covered by |
|-------|------------|
| Conversion tools | [RFC 0002](0002-conversion-tools.md) + per-tool RFCs 0017–0025, 0033–0039, … |
| Edit & organize | [RFC 0003](0003-editing-organization-tools.md) + 0006–0016, 0026, 0030–0032, 0040–0041, 0044–0045, … |
| Optimize & security | [RFC 0004](../0004-optimization-security-advanced-tools.md) + 0008, 0021–0022, 0027–0028, 0042–0043, … |
| i18n / locales | [RFC 0005](../0005-multi-language-support.md) |
| WASM / Workers | [RFC 0057](../0057-rust-wasm-worker-architecture.md), [RFC 0058](../0058-wasm-pdf-library-charter.md) |
| Site-wide UX polish | Track under [RFC 0002](0002-conversion-tools.md)–[0004](../0004-optimization-security-advanced-tools.md) umbrellas or new numbered RFC — **not** 0001 |

Shipped tool pages (merge, split, compress, …) are tracked in their own RFCs under `completed/` or active root.

## Closure

0001 was a **planning umbrella**. Downstream RFCs exist; no unique acceptance criteria remain on this doc. Further site work → edit umbrellas 0002–0005 or add RFC **0062+**.
