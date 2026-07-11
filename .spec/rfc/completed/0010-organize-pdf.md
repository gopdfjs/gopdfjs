
# RFC 0010 - Organize PDF Pages

- **Status**: Implemented (unverified — see frontmatter `verified`)
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Interactive manipulation of the page order, deletion of unwanted pages, and rotation within a single document.

## 2. Technical Specification
- **Core Library**: `@pdf-lib/pdf-lib`
- **Processing Logic**: 
    - Map the visual thumbnail order to a list of page indices.
    - Create a new `PDFDocument` and call `copyPages()` for only the kept indices in the new order.
    - Apply per-page rotation metadata as specified.

## 3. User Experience & Interface
- **Display**: High-resolution thumbnails.
- **Interactions**: Drag-and-drop to reorder, hover to delete, click to rotate.
- **Workflow**: "Save Changes" exports the newly structured PDF.

## 4. Success Criteria
- [x] Page sequence matches the visual sequence.
- [x] Deleted pages are permanently removed from the file stream.
- [x] Memory usage stays linear with page count.

## 6. Implementation status (2026-06-28)

| Surface | Package | Runtime | State | Notes |
|---------|---------|---------|-------|-------|
| **npm** | `@gopdfjs/plugin-struct` | isomorphic | **Partial** | reorder pages — one pkg, Node + browser |
| **CLI** | `gopdf-cli organize` | node | **Out of repo** | [`gopdf-cli`](https://github.com/gopdfjs/gopdf-cli) — not OSS gate |
| **Rust / WASM** | — | — | N/A | per RFC + [0057](0057-rust-wasm-engine-architecture.md) |
| **Vitest** | — | — | **Partial** | `packages/plugin-struct` |
| **Browser e2e** | — | browser | **Done** | `apps/demo/e2e/tools/all-tools.spec.ts` |
| **ilovepdf** | — | — | out of repo | consumes npm; not OSS gate |

**Verdict**: **PARTIAL** — OSS gate only ([`docs/PUBLISHING.md`](../../docs/PUBLISHING.md)). **Not** gated on `gopdf-cli` (separate repo).
