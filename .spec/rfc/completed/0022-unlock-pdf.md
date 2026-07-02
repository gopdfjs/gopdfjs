<<<<<<<< HEAD:.spec/rfc/implemented/0022-unlock-pdf.md
---
rfc: "0022"
tier: implemented
verified: false
browser_only: true
tests:
  unit: none
  e2e_playwright: none
---
========
>>>>>>>> 457a45a (Update project documentation and configuration files):.spec/rfc/completed/0022-unlock-pdf.md

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

| Layer | State | Notes |
|-------|-------|-------|
| **L3 product** | **Done** (assumed) | `/tools/unlock` on gopdf.fyi; `@gopdfjs/ui` Header nav |
| **L1 WASM** | **N/A** | Per RFC §5 — pdf-lib JS path ([0057](../0057-rust-wasm-worker-architecture.md)) |
| **Monorepo L3** | **Not in repo** | Tool runner not in tracked git; UI shell only |
| **L2 `packages/tools`** | **Not started** | No orchestration package source |
| **Tests** | **Not done** | No `.spec/e2e/tools/unlock.spec.ts` |

**Verdict**: **PARTIAL** — product **Implemented** per RFC §4; monorepo **unverified**. Strict **Done** requires E2E + optional `packages/tools` per [TASK_TRACKING](../../TASK_TRACKING.md).
