# RFC 0026 - Redact PDF

- **Status**: Proposed
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Permanently remove or mask sensitive information from PDF documents to ensure privacy and compliance.

## 2. Technical Specification
- **Core Library**: `pdf-lib` + `pdf.js` (for coordinate lookup)
- **Processing Logic**: 
    - Allow user to select text or draw black/white boxes over sensitive regions.
    - "Flatten" the document by re-rasterizing redacted areas or removing the underlying text stream entirely.
    - **Security**: Ensure that text cannot be extracted or "un-hidden" by advanced viewers.

## 3. User Experience & Interface
- **Tools**: Area redact (rectangle) and Text redact (drag-to-select).
- **Automation**: Search-and-redact for specific patterns (e.g., SSN, Credit Card numbers).
- **Preview**: "Ghosted" redaction preview before final application.

## 4. Verification & Success Criteria
- [ ] Redacted content is 100% unrecoverable from the file stream.
- [ ] Metadata (e.g., Author, Title) is also scrubbed of sensitive info if requested.
- [ ] Resulting PDF remains compliant with PDF standards (Standard 1.7+).
