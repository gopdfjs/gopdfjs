# RFC 0021 - Protect PDF

- **Status**: Implemented
- **Author**: Antigravity
- **Date**: 2026-03-22

## 1. Objective
Ensure document confidentiality by applying standard PDF encryption with user-controlled passwords.

## 2. Technical Specification
- **Core Library**: `@pdf-lib/pdf-lib` (Security handler)
- **Processing Logic**: 
    - User input is salted and hashed to create the User and Owner passwords.
    - Permissions (e.g., "No Printing", "No Editing") are set via the permissions flags.
    - File stream is encrypted using AES-256 (standard) or RC4 (compatibility).

## 3. User Experience & Interface
- **Encryption**: Modern modal with password "Show/Hide" toggle.
- **Permissions Grid**: Checkboxes for granular security (Allow Print, Allow Copy, etc.).

## 4. Success Criteria
- [x] Unprotected access to the PDF is blocked in all readers.
- [x] Password strength must meet minimum complexity (8+ chars).
- [x] Encryption happens strictly client-side.

## 5. Rust/WASM Evaluation

**Decision: Stay with JavaScript (SubtleCrypto). No WASM needed.**

The browser's `SubtleCrypto` API (specifically `crypto.subtle.encrypt` with AES-GCM) is implemented natively by the browser and uses hardware acceleration via AES-NI CPU instructions where available. A Rust WASM AES implementation runs in software and will be 2–5x slower than the hardware-accelerated native path.

**Do not replace SubtleCrypto with a WASM crypto library.** This applies to both AES-256 encryption and any SHA-based password hashing (use `crypto.subtle.digest` instead of a WASM hash).

`pdf-lib`'s security handler already delegates to the browser's native crypto where possible. No changes needed to the encryption path.
