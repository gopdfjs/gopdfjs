# RFC 0009 - Rotate PDF

- **Status**: Implemented
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Enable permanent rotation of individual PDF pages or the entire document.

## 2. Technical Specification
- **Core Library**: `@pdf-lib/pdf-lib`
- **Processing Logic**: 
    - Access the `/Rotate` value of each `PDFPage`.
    - Increment/decrement the rotation by multiples of 90 degrees.
    - Persist the change in the new PDF file stream.

## 3. User Experience & Interface
- **Visuals**: Full-screen grid of page thumbnails.
- **Actions**: Left/Right rotation buttons on each thumbnail and "Rotate All" global control.

## 4. Success Criteria
- [x] Pages appear correctly rotated in all standard PDF viewers.
- [x] Rotation is applied to the metadata, not just the visual layer.
- [x] Orientation metadata (Landscape/Portrait) is updated accordingly.
