# RFC 0041 - Reverse PDF Pages

- **Status**: Proposed
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Provide a simple utility to flip the order of all pages in a PDF document (e.g., from 10-1 to 1-10).

## 2. Technical Specification
- **Core Library**: `@pdf-lib/pdf-lib`
- **Processing Logic**: 
    - Retrieve all `PDFPage` objects from the source document.
    - Array.reverse() the page collection.
    - Create a new document with the reversed order and save.

## 3. User Experience & Interface
- **Action**: Single-button trigger on the tool page.
- **Preview**: First and last page preview showing the swapped positions.

## 4. Verification & Success Criteria
- [ ] Page numbering (if internal) is correctly reversed visually.
- [ ] Document remains structurally sound (cross-references, etc.).
- [ ] Complexity is O(N) where N is the number of pages.
