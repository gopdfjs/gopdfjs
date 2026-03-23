# RFC 0003 - Editing & Organization Tools Specification

- **Status**: Draft
- **Date**: 2026-03-22
- **Author**: Antigravity

## Context
These tools manage the structure and content of PDF documents. They are the most frequently used functions for rearranging, cleaning, and annotating files.

## Technical Goals
1.  **Non-Destructive Manipulation**: Ensure editing actions do not corrupt the original PDF structure.
2.  **Visual Interaction**: Provide real-time previews for page organization and cropping.
3.  **Efficiency**: Handle large documents without memory overflows.

## Current Tools Specification

### 1. Merge PDF
*   **Library**: `@pdf-lib/pdf-lib`
*   **Process**: Create a new PDF and copy all pages from source documents sequentially.
*   **Features**: Drag-and-drop reordering, page deletion before merge.

### 2. Split PDF
*   **Library**: `@pdf-lib/pdf-lib`
*   **Process**: Extract specific page ranges and save as separate documents or a single multi-page extract.
*   **Features**: Range selection, fixed split intervals.

### 3. Organize Pages
*   **Library**: `@pdf-lib/pdf-lib`
*   **Process**: Reorder, rotate, or delete individual pages within a single document.
*   **Interface**: Thumbnail-based grid view.

### 4. Edit PDF (Annotations)
*   **Library**: `pdf-lib` + Canvas
*   **Process**: Overlay text, shapes, and images on top of existing pages.
*   **Type**: Layered annotation (does not edit underlying text).

### 5. Crop PDF
*   **Library**: `pdf-lib` (set modification of `MediaBox`)
*   **Process**: Redefine the PDF's visible boundaries per page.

### 6. Header/Footer & Page Numbers
*   **Library**: `pdf-lib`
*   **Process**: Iteratively add text content at specified coordinates (Top/Bottom, Left/Center/Right).

## Proposed Tools Specification

### 7. Native Text Edit (Sejda Style)
*   **Strategy**: Use `pdf.js` to map text coordinates, then use `pdf-lib` to "remove" original text by drawing over it and placing new text in the same font/style.

### 8. Form Filler
*   **Strategy**: Detect `AcroForms` using `pdf-lib` and bind them to HTML input fields for browser-based completion.

### 9. Redact / Whiteout
*   **Strategy**: Draw opaque rectangles over sensitive regions and "flatten" the PDF to ensure the data is not recoverable.

---
*Created for the GoPDF system.*
