# RFC 0002 - Conversion Tools Specification

- **Status**: Draft
- **Date**: 2026-03-22
- **Author**: Antigravity

## Context
Conversion tools are the backbone of PDF processing. They allow users to move documents into and out of the PDF format while preserving as much structure and style as possible.

## Technical Goals
1.  **Browser-Native Transformation**: Perform all conversions in the client-side browser for maximum privacy.
2.  **High Fidelity**: Preserve layouts, fonts, and images.
3.  **Parallel Processing**: Use Web Workers for large-scale conversions (e.g., many images to PDF).

## Current Tools Specification

### 1. JPG to PDF
*   **Library**: `@pdf-lib/pdf-lib`
*   **Process**: Embed image files as pages into a new PDF document.
*   **Options**: Page size (Auto, A4, US Letter), margin settings, and image orientation.

### 2. PDF to JPG
*   **Library**: `pdfjs-dist`
*   **Process**: Render PDF pages onto HTML5 canvas and export as high-quality JPEGs.
*   **Options**: Resolution (DPI), image quality (0.1–1.0).

### 3. PDF to Word
*   **Library**: `pdfjs-dist` + custom parsing
*   **Process**: Extract text layers and positions to generate a `.docx` file using `docx` library.
*   **Current Limit**: Basic text extraction; lacks complex layout reconstruction.

## Proposed Tools Specification

### 4. Word/Excel/PPT to PDF
*   **Strategy**: Use `mammoth` (for Word) or `exceljs` to parse Office formats into HTML/Canvas, then use `jsPDF` or `pdf-lib` to generate PDF.

### 5. PDF to Excel/PPT
*   **Strategy**: Tabular data extraction from PDF using coordinate-based text grouping.

### 6. Web to PDF (PrintFriendly Style)
*   **Strategy**: Fetch URL (via proxy if needed), sanitize DOM to remove ads/clutter, and render to PDF using `headless-browser` or client-side print-friendly CSS.

---
*Created for the GoPDF system.*
