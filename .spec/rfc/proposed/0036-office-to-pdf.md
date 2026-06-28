---
rfc: "0036"
tier: proposed
verified: false
browser_only: true
tests:
  unit: none
  e2e_playwright: none
---

# RFC 0036 - Office to PDF (Word/Excel/PPT)

- **Status**: Proposed
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Convert Microsoft Office documents (DOCX, XLSX, PPTX) into high-fidelity PDF files without requiring local Office installations.

## 2. Technical Specification

**Browser-only golden rule**: 100% in-browser. No server-side conversion proxy. Fidelity target is **~80% of common documents** (same posture as RFC 0019), not pixel-perfect — disclose this to the user.

- **Core Library**: `mammoth` (Word) / `exceljs` (Excel) / `PptxGenJS` (PPT) + `pdf-lib`
- **Processing Logic**:
    - Parse Office XML structures into intermediate HTML/Canvas in-browser.
    - Render the result to a PDF stream using browser-native print or `pdf-lib`.
    - Heavy parsing runs in a Web Worker to keep the main thread responsive.
    - **Non-goal**: pixel-perfect fidelity for complex Word/Excel layouts; product copy must state layout may differ.

## 3. User Experience & Interface
- **Batching**: Support for multiple mixed Office files.
- **Page Layout**: Options to fit Excel sheets onto a single PDF page or maintain original orientation.
- **Disclaimer**: complex formatting may not be perfectly preserved (browser-only, no server).

## 4. Verification & Success Criteria
- [ ] Conversion runs entirely in-browser; no file bytes leave the device.
- [ ] Layout matches the original Office document as closely as the in-browser path allows (~80% common cases).
- [ ] All text remains searchable in the resulting PDF.
