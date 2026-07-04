
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

## 6. Implementation status (2026-06-28)

| Surface | Package | Runtime | State | Notes |
|---------|---------|---------|-------|-------|
| **npm** | `@gopdfjs/runners` | isomorphic | **Partial** | `unlockPdf()` — one pkg, Node + browser |
| **CLI** | `gopdf-cli unlock` | node | **Planned** | thin wrapper over npm above |
| **Rust / WASM** | — | — | N/A | per RFC + [0057](../0057-rust-wasm-worker-architecture.md) |
| **Vitest** | — | — | **Partial** | `packages/runners` |
| **Browser e2e** | — | browser | **Not done** | `demos/react/e2e/tools/unlock-pdf.spec.ts` |
| **ilovepdf** | — | — | out of repo | consumes npm; not OSS gate |

**Verdict**: **PARTIAL** — **one npm pkg by default**; split browser + `-node` **only if** single pkg infeasible ([0058 §2.3](../0058-wasm-pdf-library-charter.md)). CLI wraps npm; no forked logic.
