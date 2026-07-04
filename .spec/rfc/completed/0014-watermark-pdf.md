
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
| **npm** | `@gopdfjs/runners` | isomorphic | **Partial** | `watermarkPdf()` — one pkg, Node + browser |
| **CLI** | `gopdf-cli watermark` | node | **Planned** | thin wrapper over npm above |
| **Rust / WASM** | — | — | N/A | per RFC + [0057](../0057-rust-wasm-worker-architecture.md) |
| **Vitest** | — | — | **Partial** | `packages/runners` |
| **Browser e2e** | — | browser | **Not done** | `demos/react/e2e/tools/watermark-pdf.spec.ts` |
| **ilovepdf** | — | — | out of repo | consumes npm; not OSS gate |

**Verdict**: **PARTIAL** — **one npm pkg by default**; split browser + `-node` **only if** single pkg infeasible ([0058 §2.3](../0058-wasm-pdf-library-charter.md)). CLI wraps npm; no forked logic.
