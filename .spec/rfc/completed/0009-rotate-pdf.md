
# RFC 0009 - Rotate PDF

- **Status**: Implemented (unverified — see frontmatter `verified`)
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Enable permanent rotation of individual PDF pages or the entire document.

## 2. Technical Specification
- **Core Library**: `@pdf-lib/pdf-lib`
- **Processing Logic**: 
    - Access the `/Rotate` value of each `PDFPage`.
    - Increment/decrement the rotation by multiples of 90 degrees.
    - Persist the change in the new PDF file stream.

## 3. User Experience & Interface
- **Visuals**: Full-screen grid of page thumbnails.
- **Actions**: Left/Right rotation buttons on each thumbnail and "Rotate All" global control.

## 4. Success Criteria
- [x] Pages appear correctly rotated in all standard PDF viewers.
- [x] Rotation is applied to the metadata, not just the visual layer.
- [x] Orientation metadata (Landscape/Portrait) is updated accordingly.

## 6. Implementation status (2026-06-28)

| Surface | Package | Runtime | State | Notes |
|---------|---------|---------|-------|-------|
| **npm** | `@gopdfjs/plugin-struct` | isomorphic | **Partial** | rotate pages — one pkg, Node + browser |
| **CLI** | `gopdf-cli rotate` | node | **Out of repo** | [`gopdf-cli`](https://github.com/gopdfjs/gopdf-cli) — not OSS gate |
| **Rust / WASM** | — | — | N/A | per RFC + [0057](../0057-rust-wasm-engine-architecture.md) |
| **Vitest** | — | — | **Partial** | `packages/plugin-struct` |
| **Browser e2e** | — | browser | **Done** | `apps/demo/e2e/tools/all-tools.spec.ts` |
| **ilovepdf** | — | — | out of repo | consumes npm; not OSS gate |

**Verdict**: **PARTIAL** — OSS gate only ([0058 §3.5](../0058-engine-plugin-charter.md) · [`docs/PUBLISHING.md`](../../docs/PUBLISHING.md)). **Not** gated on `gopdf-cli` (separate repo).
