
# RFC 0012 - Edit PDF

- **Status**: Implemented (unverified — see frontmatter `verified`)
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Provide a browser-based annotation layer for adding text, images, and shapes onto existing PDF pages.

## 2. Technical Specification
- **Core Library**: `pdf-lib`
- **Processing Logic**: 
    - Render the PDF page using `pdf.js` for selection/editing.
    - Track text coordinates and objects on an HTML5 canvas.
    - Composite the canvas objects onto the PDF stream using `drawText()`, `drawImage()`, and `drawRectangle()`.

## 3. User Experience & Interface
- **Toolbar**: Text tool, image uploader, shape tool (circle, rectangle), and line tool.
- **Canvas**: Interactive select-and-move workspace with undo/redo support.
- **Properties**: Font picker, font size, stroke color, and opacity controls.

## 4. Success Criteria
- [x] User-added elements are visible in the output PDF.
- [x] Text remains editable as an object within the PDF (if supported by the viewer).
- [x] Image transparency (PNG) is preserved during embedding.

## 6. Implementation status (2026-06-28)

| Surface | Package | Runtime | State | Notes |
|---------|---------|---------|-------|-------|
| **npm** | `@gopdfjs/plugin-annotate` | isomorphic | **Partial** | annotation edit — one pkg, Node + browser |
| **CLI** | `gopdf-cli edit` | node | **Planned** | thin wrapper over npm above |
| **Rust / WASM** | — | — | N/A | per RFC + [0057](../0057-rust-wasm-engine-architecture.md) |
| **Vitest** | — | — | **Partial** | `packages/annotate` |
| **Browser e2e** | — | browser | **Not done** | `apps/demo/e2e/tools/edit-pdf.spec.ts` |
| **ilovepdf** | — | — | out of repo | consumes npm; not OSS gate |

**Verdict**: **PARTIAL** — **one npm pkg by default**; split browser + `-node` **only if** single pkg infeasible ([0058 §2.3](../0058-engine-plugin-charter.md)). CLI wraps npm; no forked logic.
