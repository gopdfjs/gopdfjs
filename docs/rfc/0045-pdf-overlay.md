# RFC 0045 - PDF Overlay (Letterhead)

- **Status**: Proposed
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Superimpose one PDF (like a letterhead or template) onto another PDF, effectively "printing" one document over the other.

## 2. Technical Specification
- **Core Strategy**: Overlaying XObjects.
- **Processing Logic**: 
    - Embed the "Letterhead" PDF as a `PDFXObject`.
    - For each page of the "Target" PDF, draw the letterhead XObject as a background or foreground layer.
    - Match page sizes or scale the overlay to fit the target.

## 3. User Experience & Interface
- **Layers**: "Draft on Letterhead" or "Letterhead on Draft".
- **Opacity**: Adjustable transparency for the overlay.
- **Positioning**: Absolute offset settings.

## 4. Verification & Success Criteria
- [ ] Both documents are perfectly aligned in the final output.
- [ ] No layout shifting or text corruption occurs.
- [ ] Support for multi-page overlays (page 1 on page 1, etc.).
