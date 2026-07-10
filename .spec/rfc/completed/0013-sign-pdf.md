
# RFC 0013 - Sign PDF

- **Status**: Implemented (unverified — see frontmatter `verified`)
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Allow users to securely sign documents using handwritten, typed, or uploaded signatures.

## 2. Technical Specification
- **Core Library**: `pdf-lib` + Signature logic
- **Processing Logic**: 
    - Capture vector paths for handwritten signatures or generate a PNG from typed text.
    - Embed the signature image as a `PDFXObject`.
    - Flatten the signature onto the page to ensure it cannot be easily removed or altered.

## 3. User Experience & Interface
- **Capture Pad**: High-fidelity pressure-sensitive drawing area.
- **Typed Signature**: Curated list of handwritten-style fonts.
- **Placement**: Simple click-to-place onto the document preview.

## 4. Success Criteria
- [x] Signatures are sharp and clear at high zoom levels.
- [x] Multiple signature instances can be added to a single document.
- [x] Support for transparent backgrounds for all signature types.

## 6. Implementation status (2026-06-28)

| Surface | Package | Runtime | State | Notes |
|---------|---------|---------|-------|-------|
| **npm** | `@gopdfjs/plugin-struct` | isomorphic | **Partial** | image signature field — one pkg, Node + browser |
| **CLI** | `gopdf-cli sign` | node | **Planned** | thin wrapper over npm above |
| **Rust / WASM** | — | — | N/A | per RFC + [0057](../0057-rust-wasm-engine-architecture.md) |
| **Vitest** | — | — | **Partial** | `packages/struct` |
| **Browser e2e** | — | browser | **Not done** | `demos/react/e2e/tools/sign-pdf.spec.ts` |
| **ilovepdf** | — | — | out of repo | consumes npm; not OSS gate |

**Verdict**: **PARTIAL** — **one npm pkg by default**; split browser + `-node` **only if** single pkg infeasible ([0058 §2.3](../0058-engine-plugin-charter.md)). CLI wraps npm; no forked logic.
