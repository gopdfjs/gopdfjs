# RFC 0029 - Halve PDF Pages

- **Status**: Proposed
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Split PDF pages down the vertical or horizontal middle, specifically for processing scanned books where two pages are captured on one sheet.

## 2. Technical Specification
- **Core Strategy**: Viewport manipulation and page duplication.
- **Processing Logic**: 
    - For each original page, create two duplicate pages in the resulting PDF.
    - Apply a `MediaBox` and `CropBox` constraint to the left (or top) half for the first duplicate.
    - Apply a corresponding constraint to the right (or bottom) half for the second duplicate.
    - Re-order the results into a continuous flow.

## 3. User Experience & Interface
- **Orientation**: Switch between Vertical split (Side-by-side) and Horizontal split (Single sheet stack).
- **Control**: Visual "Cut Line" adjustment to handle off-center scans.

## 4. Verification & Success Criteria
- [ ] Resulting PDF has exactly twice the number of pages (unless selective).
- [ ] No content is lost at the cut line.
- [ ] Consistent sizing across the halved pages.
