# RFC 0035 - Extract Images from PDF

- **Status**: Proposed
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Identify and extract all raster image assets embedded within a PDF document at their original resolution.

## 2. Technical Specification
- **Core Library**: `pdfjs-dist`
- **Processing Logic**: 
    - Scan the PDF object graph for `XObject` types where `Subtype` is `/Image`.
    - Decode the raw pixel data (DCT, Flate, etc.) into standard image buffers (PNG/JPG).
    - Save images with sequential naming (e.g., `image_001.jpg`).

## 3. User Experience & Interface
- **Gallery View**: Real-time display of images as they are discovered.
- **Bulk Action**: "Download All as ZIP" or individual file interaction.

## 4. Verification & Success Criteria
- [ ] Images are extracted at their original DPI, not rendered DPI.
- [ ] Hidden or tiny icons are correctly filtered or included based on user preference.
- [ ] Support for multiple image formats (JPG, PNG, TIFF, JP2).
