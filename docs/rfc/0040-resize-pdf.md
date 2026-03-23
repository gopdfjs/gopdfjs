# RFC 0040 - Resize PDF Pages

- **Status**: Proposed
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Modify the physical page size of a PDF (e.g., from US Letter to A4 or custom dimensions) by scaling or padding the content.

## 2. Technical Specification
- **Core Library**: `@pdf-lib/pdf-lib`
- **Processing Logic**: 
    - Read source page dimensions (`MediaBox`).
    - Scale content using `page.drawPage(originalPage, { width, height })`.
    - Handle "Fit" vs "Fill" vs "Stretch" scaling strategies.

## 3. User Experience & Interface
- **Presets**: List of standard paper sizes (A0-A10, Letter, Legal, Tabloid).
- **Scaling**: "Scale Content" vs "Add Margins/Padding" toggle.
- **Preview**: Ghosted original page over the new page size.

## 4. Verification & Success Criteria
- [ ] Content remains centered and legible after resizing.
- [ ] Hyperlinks and form fields are correctly re-mapped to the new scale.
- [ ] Support for batch resizing on documents with mixed page sizes.
