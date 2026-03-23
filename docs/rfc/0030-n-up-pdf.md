# RFC 0030 - N-up PDF (Pages per Sheet)

- **Status**: Proposed
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Combine multiple PDF pages onto a single physical sheet (e.g., 2, 4, 6 pages per sheet) to save paper and provide a compact view.

## 2. Technical Specification
- **Core Strategy**: Scaling and Tiling.
- **Processing Logic**: 
    - Create a new, larger destination page (e.g., A4).
    - Scale source pages down by a factor calculated based on the Layout Grid (e.g., 2-up = 70.7% scale).
    - Place source `Page` objects as `XObjects` onto the new sheet using absolute offsets.

## 3. User Experience & Interface
- **Grid Layouts**: 1x2, 2x1, 2x2, 2x3, 4x4 options.
- **Margins**: Configurable spacing between the sub-pages.
- **Sorting**: "Z-order" vs "N-order" placement directions.

## 4. Verification & Success Criteria
- [ ] Final PDF layout matches the chosen grid perfectly.
- [ ] Text remains legible after scaling.
- [ ] Page numbers and annotations are scaled accordingly.
