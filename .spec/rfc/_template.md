---
rfc: "NNNN"
tier: proposed
verified: false
browser_only: true
tests:
  unit: none
  e2e_playwright: none
---

# RFC NNNN - Feature Title

- **Status**: Proposed
- **Author**: 
- **Date**: YYYY-MM-DD

## 1. Objective

## 2. Browser-only golden rule

All processing in the user's browser. No server upload proxy, no cloud API that receives document bytes.

## 3. Technical specification

### 3.1 Layer assignment (RFC 0057 / 0058)

| Layer | Responsibility |
|-------|----------------|
| L3 `site/` | UI, file pick, download |
| L2 `packages/tools` | Orchestration, stats, progress |
| L1 `crates/gopdf-*` | Algorithms |
| WASM facade | `crates/pdf-wasm` + `packages/pdf-wasm` (thin JS) |

## 4. Testing strategy (required before `ready/`)

### Unit

- [ ] `crates/gopdf-*` — `cargo test` for all public Rust APIs
- [ ] `packages/tools` — Vitest for orchestration (`run*.ts`, pure helpers)

### E2E (Playwright)

- [ ] `.spec/e2e/tools/<slug>.spec.ts` — upload fixture → run tool → assert output

## 5. Success criteria

## 6. Out of scope
