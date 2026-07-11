
# RFC 0061 - Understand PDF

- **Status**: Implemented (product — L3); Planned (L1 `analyze_pdf` per [RFC 0058](0058-engine-plugin-charter.md) §3.2.3)
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Create a tool named "Understand PDF" (or "PDF Analyzer") that provides users with a comprehensive technical breakdown of any given PDF file. This helps users diagnose issues, verify metadata, and understand the internal structure of their documents before processing them with other tools (e.g., compression, merging).

## 2. Technical Specification

### 2.1 Shipped path (L3 — gopdf.fyi)

**Current product** (`/tools/understand-pdf`): browser-only analysis using **L3** libraries:

- **`pdfjs-dist`** — page structure, image XObject counts, rendering-related details
- **`pdf-lib`** — fast metadata and document properties

This matches the original spec below. Implementation lives in the **product app** (not in this monorepo's tracked `lib/tools`).

### 2.2 Planned upgrade (L1 — RFC 0058)

**Target**: `analyze_pdf` Worker `op` in `@gopdfjs/engine`, backed by PDF Object Layer (RFC 0058 §3.2). Metadata, page count, and image XObject stats without full pdf.js page render. **Not started** in `packages/engine/src/`.

### 2.3 Extracted details (acceptance)
  - **Basic File Info**: original file name, precise file size (in bytes, KB, MB).
  - **Metadata**: Title, Author, Subject, Keywords, Creator, Producer, Creation Date, Modification Date.
  - **Document Properties**: PDF Version, Page Count, whether it is linearized (Fast Web View enabled).
  - **Security**: Encryption status, permissions (printing, modifying, copying, etc.).
  - **Content Breakdown (via pdfjs-dist)**: Number of images (XObjects), font details used in the document, and dimensions of each page.

## 3. User Experience & Interface
- **Input**: Standard drag-and-drop or file selection area.
- **Processing state**: A non-blocking loading spinner while `pdfjs-dist` scans the pages (useful for large documents).
- **Result View**: A detailed, clean dashboard or list view displaying the technical details categorized logically (e.g., 'File Information', 'Metadata', 'Security', 'Content').

## 4. Verification & Success Criteria
- [ ] Processing a complex PDF with multiple images and fonts successfully lists all extracted details without crashing.
- [ ] Processing encrypted/password-protected PDFs handles the security gracefully (prompting for password or indicating failure reason).
- [ ] Performance should be adequate; large files should not block the main thread unnecessarily (Web Workers should be used if `pdfjs-dist` analysis takes too long, though `pdfjs-dist` manages its own workers naturally).

## 5. Implementation status (2026-06-28)

| Surface | Package | Runtime | State | Notes |
|---------|---------|---------|-------|-------|
| **npm** | `@gopdfjs/plugin-inspect` | isomorphic | **Partial** | JS metadata until L1 lands |
| **npm** | `@gopdfjs/engine` | isomorphic (target) | **Not started** | planned `analyzePdf()` in same engine pkg |
| **CLI** | `gopdf-cli inspect` | node | **Planned** | thin wrapper over npm above |
| **Rust / WASM** | — | — | Planned `analyze_pdf` | per RFC + [0057](../0057-rust-wasm-engine-architecture.md) |
| **Vitest** | — | — | **Partial** | `packages/inspect + packages/engine` |
| **Browser e2e** | — | browser | **Not done** | `apps/demo/e2e/tools/understand-pdf.spec.ts` |
| **ilovepdf** | — | — | out of repo | consumes npm; not OSS gate |

**Verdict**: **PARTIAL** — **one npm pkg by default**; split browser + `-node` **only if** single pkg infeasible ([0058 §2.3](../0058-engine-plugin-charter.md)). CLI wraps npm; no forked logic.
