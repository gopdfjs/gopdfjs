
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

| Surface | Package | Runtime | State | Notes |
|---------|---------|---------|-------|-------|
| **npm** | `@gopdfjs/plugin-struct` | isomorphic | **Partial** | header/footer — one pkg, Node + browser |
| **CLI** | `gopdf-cli header-footer` | node | **Out of repo** | [`gopdf-cli`](https://github.com/gopdfjs/gopdf-cli) — not OSS gate |
| **Rust / WASM** | — | — | N/A | per RFC + [0057](../0057-rust-wasm-engine-architecture.md) |
| **Vitest** | — | — | **Partial** | `packages/plugin-struct` |
| **Browser e2e** | — | browser | **Done** | `apps/demo/e2e/tools/all-tools.spec.ts` |
| **ilovepdf** | — | — | out of repo | consumes npm; not OSS gate |

**Verdict**: **PARTIAL** — OSS gate only ([0058 §3.5](../0058-engine-plugin-charter.md) · [`docs/PUBLISHING.md`](../../docs/PUBLISHING.md)). **Not** gated on `gopdf-cli` (separate repo).
