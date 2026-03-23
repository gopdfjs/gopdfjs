# RFC 0034 - PDF to EPUB/Mobi

- **Status**: Proposed
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Enable conversion of PDF ebooks or documents into reflowable formats like EPUB and MOBI for better reading experiences on mobile devices.

## 2. Technical Specification
- **Core Library**: `pdfjs-dist` + `epub-gen` (or client-side equivalent)
- **Processing Logic**: 
    - Linear text extraction to create a "flow".
    - Conversion of PDF pages to internal XHTML structures.
    - Packaging of styles, metadata, and images into the EPUB standard (OEBPS).

## 3. User Experience & Interface
- **Metadata Editor**: Allow user to set Title, Author, and Cover Image for the ebook.
- **Device Presets**: Optimized layouts for Kindle, Kobo, and iPad.

## 4. Verification & Success Criteria
- [ ] Resulting EPUB passes ePubCheck validation.
- [ ] Text remains reflowable (font size can be adjusted in readers).
- [ ] Index/TOC is generated correctly from PDF bookmarks.
