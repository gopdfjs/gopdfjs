# Roadmap

**Canonical RFC index and phase plan** for GoPDF (gopdf.fyi).  
Tasks: [TASK_TRACKING.md](TASK_TRACKING.md)

RFC bodies: `.spec/rfc/NNNN-kebab-slug.md` (active) · `.spec/rfc/completed/` (shipped) · `.spec/rfc/pending/` (deferred).  
**No** `README.md` under `.spec/` or `.spec/rfc/` (rfc-plugin three-file rule).

**North star**: [browser-only PDF tools — zero server application code](../AGENTS.md)

## Layout

```
.spec/ROADMAP.md
.spec/TASK_TRACKING.md
.spec/rfc/
  NNNN-slug.md          ← active (umbrella, WASM, proposed)
  completed/            ← shipped / closed umbrellas
  pending/              ← deferred (AI)
```

## How to read the snapshot

| Verdict | Meaning |
|---------|---------|
| **DONE** | Acceptance criteria met; safe to treat as shipped |
| **PARTIAL** | Live or coded, but spec, tests, or monorepo coverage has gaps |
| **NOT STARTED** | No meaningful implementation in repo or product |
| **DEFERRED** | In `pending/` — blocked on browser-only AI path |
| **CHARTER** | Umbrella / architecture doc only — track child RFCs |
| **CLOSED** | Umbrella folded into child RFCs — do not reopen |

**Columns**

- **Product** — gopdf.fyi tool page / UX (may live outside this git tree)
- **WASM L1** — `packages/pdf-wasm/src/*.rs` + Worker `op`
- **Monorepo** — verifiable in this repo (`@gopdfjs/ui`, `site/`, tests)
- **Tests** — `cargo test` · Vitest · `.spec/e2e/tools/*.spec.ts`

**Monorepo gap (global)**: L3 tool logic (`pdf-lib` / `pdfjs` runners) is **not** in tracked source here; `packages/tools` has **no `src/`**. Product pages are assumed live on gopdf.fyi per `completed/` RFCs.

---

## Full implementation snapshot (2026-06-28)

### Closed / charter

| ID | RFC | Verdict | Product | WASM L1 | Monorepo | Tests | Notes |
|----|-----|---------|---------|---------|----------|-------|-------|
| 0001 | Site work | **CLOSED** | baseline live | n/a | `@gopdfjs/ui`, `site/` | — | Umbrella → child RFCs; [completed/0001](rfc/completed/0001-site-work.md) |
| 0002 | Conversion umbrella | **CLOSED** | — | — | — | — | Umbrella → 0017–0025, 0033–0039; [completed/0002](rfc/completed/0002-conversion-tools.md) |
| 0003 | Editing umbrella | **CLOSED** | — | — | — | — | Umbrella → 0006–0016, 0026, 0030–0032, 0040–0041, 0044–0045; [completed/0003](rfc/completed/0003-editing-organization-tools.md) |
| 0004 | Optimize/security umbrella | **CHARTER** | — | — | — | — | Coverage map [0004](rfc/0004-optimization-security-advanced-tools.md); child RFCs track verdict |
| 0005 | i18n | **DONE** | locales on site | n/a | `@gopdfjs/i18n`, `site/messages/`, LanguagePicker | parity tests ✅ | next-intl JSON + `use-intl`; product `hreflang` TBD |
| 0057 | WASM Worker arch | **PARTIAL** | n/a | Worker + 4 ops | `packages/pdf-wasm` | compress only | Approved; matrix matches code except 0028/0042 depth |
| 0058 | WASM PDF charter | **PARTIAL** | n/a | see L1 column | docs only | — | Approved; **PDF Object Layer** not built; 0058 §3.1 overstates 0028/0042 |

### Shipped tools (`completed/`)

| ID | Tool | Verdict | Product | WASM L1 | Monorepo | Tests | Notes |
|----|------|---------|---------|---------|----------|-------|-------|
| 0006 | Merge | **PARTIAL** | live | JS (pdf-lib) | UI shell only | ❌ no E2E | RFC in `completed/`; logic not in repo |
| 0007 | Split | **PARTIAL** | live | JS | UI shell | ❌ | same |
| 0009 | Rotate | **PARTIAL** | live | JS | UI shell | ❌ | same |
| 0010 | Organize | **PARTIAL** | live | JS | UI shell | ❌ | same |
| 0011 | Crop | **PARTIAL** | live | JS | UI shell | ❌ | same |
| 0012 | Edit | **PARTIAL** | live | JS + canvas | UI shell | ❌ | same |
| 0013 | Sign | **PARTIAL** | live | JS | UI shell | ❌ | same |
| 0014 | Watermark | **PARTIAL** | live | JS | UI shell | ❌ | same |
| 0015 | Page numbers | **PARTIAL** | live | JS | UI shell | ❌ | same |
| 0016 | Header/footer | **PARTIAL** | live | JS | UI shell | ❌ | same |
| 0017 | JPG→PDF | **PARTIAL** | live | **encode_images** ✅ | UI shell | ❌ | Hybrid: WASM encoding leg only in repo |
| 0018 | PDF→JPG | **PARTIAL** | live | **encode_images** ✅ | UI shell | ❌ | Hybrid: render = pdfjs (not in repo) |
| 0020 | OCR | **PARTIAL** | live | tesseract.js | UI shell | ❌ | Not in Header nav; on product |
| 0021 | Protect | **PARTIAL** | live | JS crypto | UI shell | ❌ | same |
| 0022 | Unlock | **PARTIAL** | live | JS | UI shell | ❌ | same |

### Active — WASM / verified

| ID | Tool | Verdict | Product | WASM L1 | Monorepo | Tests | Notes |
|----|------|---------|---------|---------|----------|-------|-------|
| 0008 | Compress | **PARTIAL** | live | **P1 DONE** `compress_pdf` | ✅ full stack | ✅ E2E + `cargo test` | **P2 NOT STARTED** (image re-encode; needs object parser) |

### Active — WASM coded but RFC still Proposed (drift)

| ID | Tool | Verdict | Product | WASM L1 | Monorepo | Tests | Notes |
|----|------|---------|---------|---------|----------|-------|-------|
| 0028 | Grayscale | **PARTIAL** | unknown | **stub** `grayscale_pdf` | Worker API | ❌ | RFC §6 + 0058 aligned 2026-06-28 |
| 0042 | Web optimize | **PARTIAL** | unknown | **stub** `linearize_pdf` | Worker API | ❌ | RFC §6 + 0058 aligned 2026-06-28 |

### Active — proposed (not started in repo)

| ID | RFC | Verdict | Product | WASM L1 | Notes |
|----|-----|---------|---------|---------|-------|
| 0019 | PDF→Word | **PARTIAL** | nav link; L3 MVP assumed | ❌ `pdf_to_docx` | L1 not started; see RFC §8 |
| 0023 | Web→PDF | **NOT STARTED** | — | — | |
| 0024 | PDF→Excel | **NOT STARTED** | — | — | |
| 0025 | PDF→PPT | **NOT STARTED** | — | — | |
| 0026 | Redact | **NOT STARTED** | — | — | |
| 0027 | Repair | **NOT STARTED** | — | — | |
| 0029 | Halve | **NOT STARTED** | — | — | |
| 0030 | N-up | **NOT STARTED** | — | — | |
| 0031 | Form filler | **NOT STARTED** | — | — | |
| 0032 | Native text edit | **NOT STARTED** | — | — | |
| 0033 | PDF→text/HTML | **NOT STARTED** | — | — | |
| 0034 | PDF→EPUB | **NOT STARTED** | — | — | |
| 0035 | Extract images | **NOT STARTED** | unconfirmed | — | Not in UI Header; see RFC §5 |
| 0036 | Office→PDF | **NOT STARTED** | — | — | |
| 0037 | Scan→PDF | **NOT STARTED** | — | — | |
| 0038 | Markdown/LaTeX→PDF | **NOT STARTED** | — | — | |
| 0039 | HEIC/WebP→PDF | **NOT STARTED** | — | — | |
| 0040 | Resize | **NOT STARTED** | — | — | |
| 0041 | Reverse | **NOT STARTED** | — | — | |
| 0043 | Flatten | **NOT STARTED** | — | — | |
| 0044 | Edit metadata | **NOT STARTED** | — | — | |
| 0045 | PDF overlay | **NOT STARTED** | — | — | |
| 0049 | Invoice | **NOT STARTED** | — | — | |
| 0050 | Job app | **NOT STARTED** | — | — | |
| 0051 | QR code | **NOT STARTED** | — | — | |
| 0052 | Viewer prefs | **NOT STARTED** | — | — | |
| 0053 | Compare | **NOT STARTED** | — | — | |
| 0054 | Invert colors | **NOT STARTED** | — | — | |
| 0055 | ZIP→PDF | **NOT STARTED** | — | — | |
| 0056 | Niche formats | **NOT STARTED** | — | — | |
| 0061 | Understand PDF | **PARTIAL** | **live** L3 | ❌ `analyze_pdf` | not in repo | ❌ | RFC §5: L3 done / L1 planned |

### Deferred (`pending/`)

| ID | RFC | Verdict | Notes |
|----|-----|---------|-------|
| 0046 | AI summarizer | **DEFERRED** | Needs local / privacy-safe inference |
| 0047 | Chat with PDF | **DEFERRED** | same |
| 0048 | AI translate | **DEFERRED** | same |

Reserved: **0059**, **0060**.

---

## Roll-up counts

| Verdict | Count | RFC IDs (summary) |
|---------|-------|---------------------|
| **DONE** (strict) | 0 | — (no RFC has full spec + monorepo + E2E except 0008 P1 only) |
| **DONE** (0008 P1 only) | 1 | 0008 Phase 1 |
| **PARTIAL** | 21 | 0006–0018, 0020–0022, 0008 P2, 0028, 0042, 0057, 0058, 0019?, 0035?, 0061 |
| **CLOSED** | 3 | 0001–0003 umbrellas |
| **CHARTER** | 1 | 0004 umbrella |
| **NOT STARTED** | 27 | 0023–0027, 0029–0034, 0036–0041, 0043–0045, 0049–0056 |
| **DEFERRED** | 3 | 0046–0048 |

---

## Known drift (fix in spec pass)

1. ~~**0058 §3.1** marks 0028 / 0042 as «已实现»~~ — **fixed 2026-06-28** → Partial stub
2. ~~**0061** live on product vs RFC **Proposed**~~ — **fixed 2026-06-28** → Implemented (L3) / Planned (L1)
3. **`packages/tools`** empty — L2 orchestration missing per 0057/0058
4. **0058 PDF Object Layer** — planned; blocks 0008 P2, full 0028/0042, 0061 L1
5. ~~**0005** — `site/messages/` + parity tests~~ — **done 2026-06-28**
6. ~~**completed/0006–0022** missing §6 monorepo honesty~~ — **fixed 2026-06-28**

---

## RFC index (paths)

| ID | RFC | Doc status | Location |
|----|-----|--------------|----------|
| 0001 | [Site work](rfc/completed/0001-site-work.md) | Closed | completed |
| 0002 | [Conversion umbrella](rfc/completed/0002-conversion-tools.md) | Closed | completed |
| 0003 | [Editing umbrella](rfc/completed/0003-editing-organization-tools.md) | Closed | completed |
| 0004 | [Optimize/security umbrella](rfc/0004-optimization-security-advanced-tools.md) | Charter | active |
| 0005 | [i18n](rfc/0005-multi-language-support.md) | Completed | active |
| 0006 | [Merge](rfc/completed/0006-merge-pdf.md) | Implemented | completed |
| 0007 | [Split](rfc/completed/0007-split-pdf.md) | Implemented | completed |
| 0008 | [Compress](rfc/0008-compress-pdf.md) | Implemented P1 | active |
| 0009 | [Rotate](rfc/completed/0009-rotate-pdf.md) | Implemented | completed |
| 0010 | [Organize](rfc/completed/0010-organize-pdf.md) | Implemented | completed |
| 0011 | [Crop](rfc/completed/0011-crop-pdf.md) | Implemented | completed |
| 0012 | [Edit](rfc/completed/0012-edit-pdf.md) | Implemented | completed |
| 0013 | [Sign](rfc/completed/0013-sign-pdf.md) | Implemented | completed |
| 0014 | [Watermark](rfc/completed/0014-watermark-pdf.md) | Implemented | completed |
| 0015 | [Page numbers](rfc/completed/0015-page-numbers.md) | Implemented | completed |
| 0016 | [Header/footer](rfc/completed/0016-header-footer.md) | Implemented | completed |
| 0017 | [JPG→PDF](rfc/completed/0017-jpg-to-pdf.md) | Implemented | completed |
| 0018 | [PDF→JPG](rfc/completed/0018-pdf-to-jpg.md) | Implemented | completed |
| 0019 | [PDF→Word](rfc/0019-pdf-to-word.md) | Partial (L3) / Proposed (L1) | active |
| 0035 | [Extract images](rfc/0035-extract-images.md) | Proposed | active |
| 0020 | [OCR](rfc/completed/0020-ocr-pdf.md) | Implemented | completed |
| 0021 | [Protect](rfc/completed/0021-protect-pdf.md) | Implemented | completed |
| 0022 | [Unlock](rfc/completed/0022-unlock-pdf.md) | Implemented | completed |
| 0023–0045 | (proposed tools) | Proposed | active |
| 0046–0048 | (AI) | Deferred | pending |
| 0049–0056 | (proposed tools) | Proposed | active |
| 0057 | [WASM Worker](rfc/0057-rust-wasm-worker-architecture.md) | Approved | active |
| 0058 | [WASM charter](rfc/0058-wasm-pdf-library-charter.md) | Approved | active |
| 0061 | [Understand PDF](rfc/0061-understand-pdf.md) | Implemented (L3) / Planned (L1) | active |

*(Full paths for 0023–0056: see `.spec/rfc/` listing.)*

---

## Phases (what’s next)

| Phase | Focus | State |
|-------|--------|-------|
| **A** | Monorepo honesty | Import or document where L3 tool code lives; restore `packages/tools` |
| **B** | Verification | E2E + Vitest for each `completed/` tool (0008 template) |
| **C** | WASM truth | Align 0058 / 0028 / 0042 RFC text with stub vs done; build Object Layer |
| **D** | 0008 P2 | Image re-encode after parser |
| **E** | Proposed queue | 0019, 0061, then 0023+ per priority |
| **F** | Deferred AI | 0046–0048 when browser-only path exists |

## RFC conventions

- **Active**: `.spec/rfc/NNNN-kebab-slug.md`
- **Shipped / closed**: `.spec/rfc/completed/`
- **Deferred**: `.spec/rfc/pending/`
- **Tasks**: only [TASK_TRACKING.md](TASK_TRACKING.md)
- **Review**: rfc-workflow Phase 1 — numeric order; pointer at **0004** (0001–0003 closed)
