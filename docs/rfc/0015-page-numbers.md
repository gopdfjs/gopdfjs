# RFC 0015 - Page Numbers

- **Status**: Implemented
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Automate document collation by inserting sequential or custom numbering on all pages.

## 2. Technical Specification
- **Core Library**: `pdf-lib`
- **Processing Logic**: 
    - Loop through `PDFDocument.getPages()`.
    - Generate numbering string based on format (e.g., `Page 1`).
    - Place text at absolute or relative coordinates (Top/Bottom + Left/Center/Right).

## 3. User Experience & Interface
- **Presets**: Footer-Center, Footer-Right, Header-Right.
- **Format Builder**: Interactive preview of `{n}` and `{m}` (total count) placeholders.
- **Styles**: Font family, size, and color selection.

## 4. Success Criteria
- [x] Page numbers match the actual file order.
- [x] Numbers do not overlap with existing critical page content.
- [x] Start number can be configured (e.g., start at page 5).
