# RFC 0056 - Niche Formats to PDF (DjVu, PAGES, DWG)

- **Status**: Proposed
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Expand compatibility by allowing the conversion of specialized and legacy formats like DjVu (ebooks), Apple PAGES, and AutoCAD DWG into PDF.

## 2. Technical Specification
- **Core Strategy**: Specialized parsers + Rasterization.
- **Processing Logic**: 
    - Use `djvu.js` or similar decoders to extract page bitmaps from DjVu files.
    - Use coordinate-based rendering for DWG/DXF vector paths.
    - Convert extracted layers into a standard PDF page stream.

## 3. User Experience & Interface
- **Uploader**: Comprehensive list of "Supported Niche Formats" displayed.
- **Warning**: Disclaimer regarding layout fidelity for complex architectural DWG files.

## 4. Verification & Success Criteria
- [ ] Resulting PDF is readable in any standard viewer.
- [ ] Text layers in DjVu (if present) are preserved.
- [ ] Page orientation and scale are correctly mapped.
