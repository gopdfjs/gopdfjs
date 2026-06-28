---
rfc: "0022"
tier: implemented
verified: false
browser_only: true
tests:
  unit: none
  e2e_playwright: none
---

# RFC 0022 - Unlock PDF

- **Status**: Implemented (unverified — see frontmatter `verified`)
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Provide a decryption utility to remove security restrictions from PDF documents when the password is known.

## 2. Technical Specification
- **Core Library**: `@pdf-lib/pdf-lib`
- **Processing Logic**: 
    - Detect the presence of an `/Encrypt` dictionary.
    - Decrypt objects using the provided User/Owner password.
    - Re-save the `xref` table without encryption flags.

## 3. User Experience & Interface
- **Detection**: Instant auto-prompt for password when an encrypted file is uploaded.
- **Confirmation**: "Password Verified" check.
- **Download**: Permanent removal of security for offline usage.

## 4. Success Criteria
- [x] Unlocked PDFs are correctly saved with no security restrictions.
- [x] Metadata (Title, Author) remains intact after decryption.
- [x] Support for multi-level AES encryption types.
