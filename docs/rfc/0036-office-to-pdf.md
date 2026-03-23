# RFC 0036 - Office to PDF (Word/Excel/PPT)

- **Status**: Proposed
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Convert Microsoft Office documents (DOCX, XLSX, PPTX) into high-fidelity PDF files without requiring local Office installations.

## 2. Technical Specification
- **Core Library**: `mammoth` (Word) / `exceljs` (Excel) / `PptxGenJS` (PPT) + `pdf-lib`
- **Processing Logic**: 
    - Parse Office XML structures into intermediate HTML/Canvas.
    - Render the result to a PDF stream using browser-native print or a high-level PDF writing API.
    - **Note**: Complex Word/Excel formatting may require a server-side conversion proxy for 100% fidelity.

## 3. User Experience & Interface
- **Batching**: Support for multiple mixed Office files.
- **Page Layout**: Options to fit Excel sheets onto a single PDF page or maintain original orientation.

## 4. Verification & Success Criteria
- [ ] Layout matches the original Office document as closely as possible.
- [ ] All text remains searchable in the resulting PDF.
- [ ] Charts and tables are rendered correctly without overlap.
