# RFC 0042 - Web Optimization (Linearization)

- **Status**: Proposed
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Optimize PDFs for "Fast Web View," allowing them to be opened and read page-by-page over a network before the full download is complete.

## 2. Technical Specification
- **Core Strategy**: Linearization.
- **Processing Logic**: 
    - Reorganize the PDF objects into a sequential stream starting with the catalog and page map.
    - Move non-critical assets (e.g., high-res images) to the end of the stream.
    - Set the "Linearized" dictionary flag.

## 3. User Experience & Interface
- **Feedback**: "DASH-ready" indicator for optimized files.
- **Comparison**: Show speed improvement for web-based reading.

## 4. Verification & Success Criteria
- [ ] PDF opens instantly in browser viewers regardless of total size.
- [ ] The `Linearized` flag is detected by tools like `qpdf` or `pdf-lib`.
- [ ] No visual data loss occurs during linearization.

## 5. Rust/WASM Acceleration

**Decision: Use Rust/WASM via Web Worker.**

PDF linearization requires a complete rewrite of the file's object graph: every indirect object must be assigned a new byte offset, the cross-reference table rebuilt, and the hint stream generated. This is a memory-intensive operation that reads and rewrites the entire file. For a 50 MB PDF, this involves allocating and processing tens of thousands of objects in a single pass. JS object allocation at this scale causes significant GC pressure.

Rust's ownership model means the entire transformation can be done in a single linear memory pass with predictable allocation, and the resulting bytes returned to the host via `Transferable` with zero copy.

**Note**: `pdf-lib` does not support linearization. This operation must be implemented natively in Rust — it cannot delegate to pdf-lib.

**Integration**: Import `linearizePdf` from **`@gopdfjs/pdf-wasm`**（RFC 0057）。

```ts
import { linearizePdf } from "@gopdfjs/pdf-wasm";

const result = await linearizePdf(inputBytes);
```

**Scope of Rust work**: Parse the PDF's cross-reference table, walk the object graph, reorder objects according to the linearization spec (PDF 1.7 §F.3), write the Linearized dictionary, generate the primary and overflow hint streams, and emit the final byte stream. Reference: Adobe PDF 1.7 specification Appendix F.
