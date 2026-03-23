# RFC 0043 - Flatten PDF

- **Status**: Proposed
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Merge all interactive elements (form fields, annotations, signatures) into the base page stream as static visual content, preventing further editing.

## 2. Technical Specification
- **Core Library**: `pdf-lib` + `canvas`
- **Processing Logic**: 
    - Rasterize every PDF page at 300 DPI (using `pdfjs-dist`).
    - Save the result as an image-only PDF or use `Flatten` logic in the PDF writing API.
    - Remove all interactive `AcroForm` data and annotation dictionaries.

## 3. User Experience & Interface
- **Trigger**: "Flatten Now" button.
- **Feedback**: Warning that this process is irreversible and prevents future form filling.

## 4. Verification & Success Criteria
- [ ] No fields can be selected or edited in standard viewers.
- [ ] Signatures and text overlays become part of the static document layer.
- [ ] Significant security improvement for sensitive documents.
