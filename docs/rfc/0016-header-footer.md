# RFC 0016 - Header & Footer

- **Status**: Implemented
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Enable users to add consistent branding or metadata into the top (header) and bottom (footer) regions of all document pages.

## 2. Technical Specification
- **Core Library**: `pdf-lib`
- **Processing Logic**: 
    - Divide page width into thirds (Left, Center, Right).
    - Insert text or image assets at absolute coordinates relative to the page height (e.g., footer at `y = 20`).
    - Handle page-specific overrides (e.g., skip first page).

## 3. User Experience & Interface
- **Editor**: Multi-field input area with alignment toggles.
- **Styling**: Contextual toolbar for font family, size, and weight.
- **Options**: Start page selector and individual "Skip Header" per page checkbox.

## 4. Success Criteria
- [x] Content is correctly positioned in the margins.
- [x] Consistency across mixed-orientation pages (Portrait/Landscape).
- [x] Export does not cut off header/footer details.
