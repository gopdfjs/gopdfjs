
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
| **npm** | `@gopdfjs/plugin-struct` | isomorphic | **Partial** | `unlockPdf()` — one pkg, Node + browser |
| **CLI** | `gopdf-cli unlock` | node | **Out of repo** | [`gopdf-cli`](https://github.com/gopdfjs/gopdf-cli) — not OSS gate |
| **Rust / WASM** | — | — | N/A | per RFC + [0057](0057-rust-wasm-engine-architecture.md) |
| **Vitest** | — | — | **Partial** | `packages/plugin-struct` |
| **Browser e2e** | — | browser | **Done** | `apps/demo/e2e/tools/all-tools.spec.ts` |
| **ilovepdf** | — | — | out of repo | consumes npm; not OSS gate |

**Verdict**: **PARTIAL** — OSS gate only ([`docs/PUBLISHING.md`](../../docs/PUBLISHING.md)). **Not** gated on `gopdf-cli` (separate repo).
