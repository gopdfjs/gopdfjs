# RFC 0028 - Grayscale PDF

- **Status**: Proposed
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Convert all color elements (images, text, vector graphics) within a PDF into grayscale to reduce ink usage and minimize file size.

## 2. Technical Specification
- **Core Library**: `pdf-lib` + Color conversion logic
- **Processing Logic**: 
    - Iterate through PDF resources (Images, ExtGState, etc.).
    - For images: Apply a grayscale filter or convert pixel data to the `DeviceGray` color space.
    - For text/vector: Map CMYK/RGB values to their equivalent Gray intensity.

## 3. User Experience & Interface
- **Preview**: Real-time "Before vs After" grayscale comparison.
- **Toggle**: Option for "Black & White" (High contrast) or "Grayscale" (Shades of gray).

## 4. Verification & Success Criteria
- [ ] Output PDF contains solely `DeviceGray` or `CalGray` color spaces.
- [ ] Text legibility is maintained across all gray levels.
- [ ] Significant reduction in file size for documents with high-color density.

## 5. Rust/WASM Acceleration

**Decision: Use Rust/WASM via Web Worker.**

Grayscale conversion requires iterating every pixel of every embedded image stream in the PDF — converting RGB or CMYK values to luminance. For a document with many high-resolution images, this involves processing tens of millions of pixel values. In JS, this requires `Uint8ClampedArray` manipulation in a tight loop, which is slow due to bounds-checking overhead and GC pressure. Rust processes the same loop with zero overhead.

**Integration**: Import `grayscalePdf` from **`@gopdfjs/pdf-wasm`**（RFC 0057）。

```ts
import { grayscalePdf } from "@gopdfjs/pdf-wasm";

const result = await grayscalePdf(inputBytes);
```

**Scope of Rust work**: The Rust function parses the PDF's image XObjects, decodes each embedded image stream, applies the standard luminance formula (`Y = 0.299R + 0.587G + 0.114B`) per pixel, re-encodes as `DeviceGray`, and rewrites the PDF image stream in-place. Vector graphics color conversion (text, paths) is simpler and can remain in a pdf-lib post-processing step if needed.
