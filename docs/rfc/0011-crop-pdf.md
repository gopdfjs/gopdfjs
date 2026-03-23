# RFC 0011 - Crop PDF

- **Status**: Implemented
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Enable users to visually trim PDF page margins or resize the viewable area.

## 2. Technical Specification
- **Core Library**: `@pdf-lib/pdf-lib`
- **Processing Logic**: 
    - Identify the current `MediaBox` and `CropBox` values.
    - Set new `PDFPage.setMediaBox()` and `PDFPage.setCropBox()` based on input coordinates.
    - Ensure page content is correctly centered or shifted if needed.

## 3. User Experience & Interface
- **Overlay**: An adjustable dashed-line box over the PDF preview.
- **Inputs**: Absolute margin values (Top, Right, Bottom, Left) or aspect ratio presets (e.g., A4, US Letter).
- **Preview**: Dual-view comparison of the original vs cropped page.

## 4. Success Criteria
- [x] Cropping values are accurately reflected in the final output.
- [x] All PDF pages can be cropped simultaneously or individually.
- [x] Links and annotations within the cropped area remain functional.
