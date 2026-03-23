# RFC 0044 - Edit PDF Metadata

- **Status**: Proposed
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Modify the hidden document properties (Title, Author, Subject, Keywords) that appear in the PDF "Document Properties" window.

## 2. Technical Specification
- **Core Library**: `@pdf-lib/pdf-lib`
- **Processing Logic**: 
    - Access the `/Info` dictionary of the PDF catalog.
    - Set new values for `setTitle()`, `setAuthor()`, `setSubject()`, `setKeywords()`.
    - Handle standard and custom metadata keys.

## 3. User Experience & Interface
- **Editor**: Clean form with fields for Title, Author, Subject, and Keywords.
- **Bulk Action**: Ability to apply the same Author or Keywords to multiple documents.

## 4. Verification & Success Criteria
- [ ] Metadata is correctly saved and visible in standard PDF viewers.
- [ ] Support for UTF-8 character encoding in metadata fields.
- [ ] Creation and Modification dates are updated if requested.
