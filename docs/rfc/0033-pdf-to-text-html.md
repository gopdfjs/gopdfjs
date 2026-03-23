# RFC 0033 - PDF to Text/RTF/HTML

- **Status**: Proposed
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Extract textual content from PDF documents and export it into plain text (.txt), Rich Text (.rtf), or web-ready HTML formats.

## 2. Technical Specification
- **Core Library**: `pdfjs-dist` + `DOMPurify` (for HTML)
- **Processing Logic**: 
    - Full-text stream extraction using `pdfjs.getTextContent()`.
    - Sanitization of HTML tags to prevent XSS.
    - Preservation of basic whitespace and line breaks for TXT/RTF.

## 3. User Experience & Interface
- **Output Format**: Dropdown for TXT, RTF, or HTML.
- **Advanced**: Option to include or exclude images from the HTML output.

## 4. Verification & Success Criteria
- [ ] Text content matches the original PDF exactly.
- [ ] RTF output is readable by standard word processors (WordPad, TextEdit).
- [ ] HTML output is responsive and maintains a clean structure.
