
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

| Surface | Package | Runtime | State | Notes |
|---------|---------|---------|-------|-------|
| **npm** | `@gopdfjs/plugin-struct` | isomorphic | **Partial** | page numbers — one pkg, Node + browser |
| **CLI** | `gopdf-cli page-numbers` | node | **Out of repo** | [`gopdf-cli`](https://github.com/gopdfjs/gopdf-cli) — not OSS gate |
| **Rust / WASM** | — | — | N/A | per RFC + [0057](../0057-rust-wasm-engine-architecture.md) |
| **Vitest** | — | — | **Partial** | `packages/plugin-struct` |
| **Browser e2e** | — | browser | **Done** | `apps/demo/e2e/tools/all-tools.spec.ts` |
| **ilovepdf** | — | — | out of repo | consumes npm; not OSS gate |

**Verdict**: **PARTIAL** — OSS gate only ([0058 §3.5](../0058-engine-plugin-charter.md) · [`docs/PUBLISHING.md`](../../docs/PUBLISHING.md)). **Not** gated on `gopdf-cli` (separate repo).
