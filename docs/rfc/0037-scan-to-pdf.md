# RFC 0037 - Scan to PDF

- **Status**: Proposed
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Use any webcam or mobile camera directly through the web browser to capture physical documents and save them as PDFs.

## 2. Technical Specification
- **Core Library**: `MediaDevices API` + `pdf-lib`
- **Processing Logic**: 
    - Access camera feed via `getUserMedia`.
    - Apply perspective correction and edge detection to "straighten" captured sheets.
    - Convert captured frames to high-resolution JPGs and embed into a PDF.

## 3. User Experience & Interface
- **Camera View**: Live viewfinder with document boundary detection.
- **Editing**: One-click "Apply Filter" (Black & White, Grayscale, Photo).
- **Batching**: "Add Page" workflow for multi-page scanning.

## 4. Verification & Success Criteria
- [ ] Captured text is clear enough for subsequent OCR.
- [ ] Auto-cropping correctly identifies document edges against various backgrounds.
- [ ] Final PDF maintains a small file size optimized for sharing.
