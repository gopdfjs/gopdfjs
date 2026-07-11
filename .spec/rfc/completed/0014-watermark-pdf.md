
# RFC 0014 - Watermark PDF

- **Status**: Implemented (unverified — see frontmatter `verified`)
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Protect intellectual property by overlaying semi-transparent text or branding images across PDF pages.

## 2. Technical Specification
- **Core Library**: `pdf-lib`
- **Processing Logic**: 
    - Set the `graphicsState` for opacity.
    - Calculate placement (Center, Mosaic/Grid, or manual coordinates).
    - Draw the watermark onto the top layer of each selected page.

## 3. User Experience & Interface
- **Inputs**: Custom text string or direct file upload for logo watermarks.
- **Options**: Opacity slider (0-100%), Rotation angle, and specific page range selection.

## 4. Success Criteria
- [x] Watermark appears on every specified page.
- [x] Opacity level allows for readability of the underlying content.
- [x] Logo watermarks maintain their original aspect ratio.

## 6. Implementation status (2026-06-28)

| Surface | Package | Runtime | State | Notes |
|---------|---------|---------|-------|-------|
| **npm** | `@gopdfjs/plugin-struct` | isomorphic | **Partial** | `watermarkPdf()` — one pkg, Node + browser |
| **CLI** | `gopdf-cli watermark` | node | **Out of repo** | [`gopdf-cli`](https://github.com/gopdfjs/gopdf-cli) — not OSS gate |
| **Rust / WASM** | — | — | N/A | per RFC + [0057](../0057-rust-wasm-engine-architecture.md) |
| **Vitest** | — | — | **Partial** | `packages/plugin-struct` |
| **Browser e2e** | — | browser | **Done** | `apps/demo/e2e/tools/all-tools.spec.ts` |
| **ilovepdf** | — | — | out of repo | consumes npm; not OSS gate |

**Verdict**: **PARTIAL** — OSS gate only ([0058 §3.5](../0058-engine-plugin-charter.md) · [`docs/PUBLISHING.md`](../../docs/PUBLISHING.md)). **Not** gated on `gopdf-cli` (separate repo).
