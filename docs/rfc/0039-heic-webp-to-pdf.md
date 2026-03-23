# RFC 0039 - HEIC/WebP to PDF

- **Status**: Proposed
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Support modern image formats (Apple's HEIC, Google's WebP) by converting them into universally compatible PDF documents.

## 2. Technical Specification
- **Core Library**: `heic2any` / `libwebpjs` + `pdf-lib`
- **Processing Logic**: 
    - Decode HEIC/WebP buffers into a canvas-compatible format (JPG/PNG).
    - Insert decoded image into a new PDF stream.
    - Preserve original EXIF metadata (orientation, date taken).

## 3. User Experience & Interface
- **Detection**: Automatic format identification on upload.
- **Tools**: Bulk conversion utility for mixed image formats.

## 4. Verification & Success Criteria
- [ ] High-fidelity color representation for HEIC (10-bit color).
- [ ] WebP transparency is correctly handled via Png embedding.
- [ ] Batch processing for 50+ images works without memory leak.
