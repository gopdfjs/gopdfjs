# Task tracking

Operational tasks linked to [ROADMAP.md](ROADMAP.md). Mark **Done** when merged to `main`.

## Full picture (one screen)

```
CLOSED     0001 0002 0003 0004 umbrellas
PARTIAL    0006–0022 tools (product live, monorepo thin) · 0008 P1 ✅ P2 ❌
PARTIAL    0028 0042 WASM stubs · 0057 0058 arch · 0019? 0035? 0061 product ahead of RFC
NOT START  0023–0027 0029–0034 0036–0041 0043–0045 0049–0056
DEFERRED   0046–0048 AI
ONLY E2E   0008 compress
ONLY WASM  compress encode_images grayscale* linearize*  (*stubs)
MISSING    pdf object layer · ilovepdf still on `@gopdf/*` imports
```

---

## rfc-workflow (agents)

1. Read RFC → structured analysis ([ROADMAP snapshot](ROADMAP.md#full-implementation-snapshot-2026-06-28))
2. User picks 1–4 (full / phased / partial / analysis-only)
3. Plan → explicit `yes` before code
4. Status change → update this file + ROADMAP + RFC header same PR

---

## Done

- [x] RFC layout: flat `.spec/rfc/` + `completed/` + `pending/`
- [x] ROADMAP + TASK_TRACKING (no `rfc/README.md`)
- [x] 0001 closed → `completed/0001-site-work.md`
- [x] 0002 closed → `completed/0002-conversion-tools.md` (0017–0025, 0033–0039 covered)
- [x] 0003 closed → `completed/0003-editing-organization-tools.md` (0006–0016, 0026, 0030–0032, 0040–0041, 0044–0045 covered)
- [x] 0008 P1: `compress_pdf` + `cargo test` + `demos/react/e2e/tools/compress.spec.ts`
- [x] WASM exports: `compressPdf`, `encodeImages`, `grayscalePdf`, `linearizePdf`
- [x] **L3 libs** — `@gopdfjs/files`, `render`, `runners` + tool packages from ilovepdf
- [x] **`@gopdfjs/pdf-cli`** — `gopdf-cli` bin + `pnpm build:cli`
- [x] ROADMAP full implementation snapshot (2026-06-28)
- [x] 0004 closed → `completed/0004-optimization-security-advanced-tools.md` (child RFCs generated)
- [x] **completed/0006–0022** — §6 Implementation status on all shipped tool RFCs

## In progress

- [ ] **(CURRENT)** Wire ilovepdf `apps/web` to `@gopdfjs/*` workspace/npm (replace `@gopdf/*`)

## Done — spec drift (2026-06-28)

- [x] **0058 §3.1 + §4** — 0028/0042 marked Partial stub (not Done)
- [x] **0028 / 0042** — added §6 Implementation status
- [x] **0057 §6** — matrix notes stub for 0028/0042
- [x] **0061** — L3 Implemented / L1 Planned + §5 status
- [x] **0005** — product i18n moved out of OSS monorepo (ilovepdf owns `use-intl` stack)
- [x] **0019 / 0035** — § Implementation status + ROADMAP verdict

## To do — P0 (clarity / honesty)

- [x] Add **§6 Implementation status** to all `completed/` tool RFCs (0006–0022)
- [ ] Document or import **L3 tool runners** (pdf-lib/pdfjs) into monorepo
- [ ] Manually verify **0035** on gopdf.fyi → bump RFC status if live

## To do — P1 (verification gate)

Template: Vitest on package + `demos/react/e2e/tools/<slug>.spec.ts` (copy 0008; see skill `gopdf-e2e`).

- [ ] 0006 merge · 0007 split · 0009 rotate · 0010 organize · 0011 crop
- [ ] 0012 edit · 0013 sign · 0014 watermark · 0015 page numbers · 0016 header/footer
- [ ] 0017 jpg→pdf · 0018 pdf→jpg · 0020 ocr · 0021 protect · 0022 unlock

## To do — P2 (WASM)

- [ ] **PDF Object Layer** (0058 §3.2) — unblocks 0008 P2, real 0028/0042
- [ ] 0008 Phase 2 — lossy image re-encode in PDF streams
- [ ] 0028 — full grayscale (content streams, not byte scan only)
- [ ] 0042 — real linearization (xref, hints, object order)
- [ ] 0019 — `pdf_to_docx` in Rust (per RFC)
- [ ] 0061 — `analyze_pdf` in Rust (per 0058 upgrade path)

## To do — P3 (proposed backlog)

Do not implement until **Approved** + rfc-workflow.

0023–0027 · 0029–0034 · 0036–0041 · 0043–0045 · 0049–0056

## To do — deferred

0046–0048 — browser-only AI path

## Review queue

Next RFC Phase 1 audit: first **open tool RFC** (0001–0004 umbrellas closed). See [ROADMAP umbrella lifecycle](ROADMAP.md#umbrella-rfc-lifecycle).
