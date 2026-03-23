# RFC 0032 - Native Text Edit

- **Status**: Proposed
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Enable direct modification of existing text within a PDF document, simulating "Word-like" editing.

## 2. Technical Specification
- **Core Strategy**: Locate, Mask, and Overlay.
- **Processing Logic**: 
    - Use `pdf.js` to extract text run coordinates and font styles.
    - Mask original text by drawing a background-colored rectangle over it via `pdf-lib`.
    - Place new text on top using matched font metrics and positioning.

## 3. User Experience & Interface
- **Interactivity**: Click-to-edit interface directly on the PDF canvas.
- **Contextual Menu**: Font size, color, and Bold/Italic overrides.

## 4. Verification & Success Criteria
- [ ] Edited text appears seamless with the original content.
- [ ] Original text is completely hidden/removed from the searchable layer.
- [ ] Support for multiline text wrapping during editing.
