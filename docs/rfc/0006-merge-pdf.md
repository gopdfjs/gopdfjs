# RFC 0006 - Merge PDF

- **Status**: Implemented
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Enable users to combine multiple PDF documents into a single file while maintaining a custom order.

## 2. Technical Specification
- **Core Library**: `@pdf-lib/pdf-lib`
- **Processing Logic**: 
    - Read source PDF buffers and parse into `PDFDocument` objects.
    - Create a destination `PDFDocument`.
    - Iteratively copy pages using `copyPages()` and `addPage()`.
    - Output is a single `Uint8Array`/`Blob`.

## 3. User Experience & Interface
- **Uploader**: Multi-file drop zone with sortable thumbnails.
- **Controls**: "Merge Now" button, individual page deletion, and drag-and-drop reordering.
- **Preview**: Real-time summary of the final document size and page count.

## 4. Success Criteria
- [x] Multiple PDFs are combined into one.
- [x] Page order matches the user's custom sequence.
- [x] Large files (>50MB) do not crash the browser.

## 5. Rust/WASM Evaluation

**Decision: Stay with JavaScript (pdf-lib). No WASM needed.**

Merging PDFs is an I/O-bound operation, not a compute-bound one. `pdf-lib`'s `copyPages()` reads page object references from source documents and appends them to a destination document — this is primarily pointer manipulation and buffer reads, with no pixel processing or stream recompression. The bottleneck is reading large file buffers from disk/memory, which WASM cannot accelerate.

**If large files (>100 MB) cause memory issues**, the correct fix is to process documents in streaming chunks using `pdf-lib`'s incremental parsing mode, not to add WASM. Consider moving the merge operation to a plain JS Web Worker to avoid main-thread memory pressure on very large inputs.
