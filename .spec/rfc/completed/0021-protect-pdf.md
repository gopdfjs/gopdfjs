<<<<<<<< HEAD:.spec/rfc/implemented/0021-protect-pdf.md
---
rfc: "0021"
tier: implemented
verified: false
browser_only: true
tests:
  unit: none
  e2e_playwright: none
---
========
>>>>>>>> 457a45a (Update project documentation and configuration files):.spec/rfc/completed/0021-protect-pdf.md

# RFC 0021 - Protect PDF

- **Status**: Implemented (unverified — see frontmatter `verified`)
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

## 6. Implementation status (2026-06-28)

| Layer | State | Notes |
|-------|-------|-------|
| **L3 product** | **Done** (assumed) | `/tools/protect` on gopdf.fyi; `@gopdfjs/ui` Header nav |
| **L1 WASM** | **N/A** | Per RFC §5 — pdf-lib crypto JS path ([0057](../0057-rust-wasm-worker-architecture.md)) |
| **Monorepo L3** | **Not in repo** | Tool runner not in tracked git; UI shell only |
| **L2 `packages/tools`** | **Not started** | No orchestration package source |
| **Tests** | **Not done** | No `.spec/e2e/tools/protect.spec.ts` |

**Verdict**: **PARTIAL** — product **Implemented** per RFC §4; monorepo **unverified**. Strict **Done** requires E2E + optional `packages/tools` per [TASK_TRACKING](../../TASK_TRACKING.md).
