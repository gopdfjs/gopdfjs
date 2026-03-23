# RFC 0020 - OCR PDF

- **Status**: Implemented
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Convert "dead" scanned PDF documents into "live" searchable files by recognizing and overlaying machine-readable text.

## 2. Technical Specification
- **Core Library**: `tesseract.js` + `pdf-lib`
- **Processing Logic**: 
    - Rasterize every PDF page at 300 DPI.
    - Execute OCR worker pool (Web Workers) to analyze character shapes.
    - Map recognized characters to original positions.
    - Superimpose a transparent but selectable text layer onto the PDF.

## 3. User Experience & Interface
- **Setup**: Selection for 100+ supported languages.
- **Feedback**: Worker-level progress (e.g., "Worker 1: Page 5/20").
- **Final Result**: Instant preview allowing text selection.

## 4. Success Criteria
- [x] Large documents (100+ pages) are handled via worker rotation.
- [x] Higher than 90% accuracy for clean typewriter/standard fonts.
- [x] Text layer alignment remains pixel-perfect to visual characters.

## 5. Rust/WASM Evaluation

**Decision: Stay with JavaScript (Tesseract.js). No additional WASM needed.**

Tesseract.js is already a WASM build of the Tesseract C++ library. Adding a second WASM layer (a Rust wrapper around Tesseract) would add binary size and complexity with zero performance benefit.

The current architecture — Worker pool with one Worker per CPU core, each running a Tesseract.js instance — is the correct approach. The bottleneck is Tesseract's neural network inference, which cannot be meaningfully accelerated by a Rust wrapper.

**One potential future improvement**: Replace the Canvas-based page rasterization (pdfjs → Canvas → `getImageData`) with a Rust/WASM pixel pre-processing pass (deskew, denoise, binarize) before handing to Tesseract. This would improve OCR accuracy on low-quality scans, not throughput. Track as a separate RFC if pursued.
