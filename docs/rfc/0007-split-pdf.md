# RFC 0007 - Split PDF

- **Status**: Implemented
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Allow users to extract specific pages or ranges from a PDF and save them as new documents.

## 2. Technical Specification
- **Core Library**: `@pdf-lib/pdf-lib`
- **Processing Logic**: 
    - Parse the source document.
    - Map user-defined ranges (e.g., `1-3, 5, 10-12`) to page indices.
    - Create new `PDFDocument` instances for each extraction set.
    - Save as a single extracted PDF or multiple individual page files.

## 3. User Experience & Interface
- **Selector**: Visual page scrubber and grid view with checkboxes.
- **Modes**: "Custom Ranges", "Fixed Intervals", "Extract all pages".
- **Download**: Automatic ZIP generation if multiple files are produced.

## 4. Success Criteria
- [x] Users can select specific pages for extraction.
- [x] Extracted documents maintain the original page dimensions.
- [x] High-fidelity preservation of hidden metadata and bookmarks.
