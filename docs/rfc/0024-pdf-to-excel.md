# RFC 0024 - PDF to Excel

- **Status**: Proposed
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Extract tabular data from PDF documents and export it into structured Microsoft Excel (.xlsx) or CSV formats.

## 2. Technical Specification
- **Core Library**: `pdfjs-dist` + `exceljs`
- **Processing Logic**: 
    - Perform "Table Detection" using spatial heuristics (aligned text rows/columns).
    - Map PDF coordinates to Excel cell grid (A1, B2, etc.).
    - Distinguish between numeric data, dates, and text strings.
    - Generate XLSX file with proper cell formatting.

## 3. User Experience & Interface
- **Preview**: Highlighting of detected tables on the PDF preview.
- **Refinement**: Manual table boundary adjustment tool.
- **Export**: Options for "Single Sheet" or "Sheet per Page".

## 4. Verification & Success Criteria
- [ ] Numeric integrity is maintained (no data loss during extraction).
- [ ] Multi-line cell content is correctly wrapped within the Excel cell.
- [ ] Hidden tables (no borders) are detected using text alignment cues.
