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
  NNNN-slug.md          ← active tool / WASM / proposed
  _template.md          ← tool RFC
  completed/            ← every closed RFC (tool · umbrella · architecture)
  pending/              ← deferred (AI)
```

## How to read the snapshot

| Verdict | Meaning (**this repo only**) |
|---------|------------------------------|
| **DONE** | OSS publish gate met for that tool/npm surface |
| **PARTIAL** | Code in monorepo, but Vitest · browser e2e · or npm publish prep still open |
| **NOT STARTED** | No meaningful implementation in this repo |
| **DEFERRED** | In `pending/` — blocked on browser-only AI path |
| **CLOSED** | Spec job done → `completed/`; do not reopen |

**OSS publish gate ([`docs/PUBLISHING.md`](../docs/PUBLISHING.md))** — verdicts **ignore** [`gopdf-cli`](https://github.com/gopdfjs/gopdf-cli) (separate repo):

| Gate | Where |
|------|--------|
| `engine.*()` on `Gopdf` | `packages/engine` |
| Plugin Vitest | `packages/plugin-*` |
| Browser demo e2e | `apps/demo/e2e/tools/` |
| Rust/WASM (if tool uses L1) | `crates/*` · `pnpm test:rust` |
| Public exports + layer deps | `pnpm check:public-exports` · `check:layer-deps` |
| npm publish prep | `dist/` build · `exports` → dist · remove `private` |

**Not an OSS gate:** CLI subcommands · MCP install · ilovepdf product UI.

**Columns**

- **Consumer (ilovepdf)** — gopdf.fyi UX (out of repo; consumes `@gopdfjs/*`)
- **WASM L1** — `crates/gopdf-*` + `@gopdfjs/wasm`
- **Monorepo** — verifiable here (`packages/*`, `apps/demo`)
- **Tests** — Vitest · `pnpm test:e2e` · `cargo test` (when WASM)

---

## Publish-ready goal

Ship **`@gopdfjs/engine`** + **`adapter-browser`** + **`adapter-node`** to npm. Remaining OSS work:

| Priority | Item | Status |
|----------|------|--------|
| **P0** | `dist/` build on **3 public packages only** (engine + adapters) | ❌ |
| **P0** | `publishConfig` on those 3 only — **plugin-* stay `private`** | partial |
| **P0** | Bundler WASM docs (Vite) | ❌ |
| **P1** | Plugin Vitest gaps (organize · crop · sign · page-numbers · header-footer) | ❌ |
| **P1** | OCR demo route + e2e (0020) | ❌ |
| **P1** | Node adapter integration (0058 §3.4) | partial |
| **P2** | 0008 P2 · full 0028/0042 WASM · PDF Object Layer | future |

---

## Full implementation snapshot (2026-07-11)

### Closed (umbrellas + architecture RFCs)

| ID | RFC | Verdict | Consumer (ilovepdf) | WASM L1 | Monorepo | Tests | Notes |
|----|-----|---------|---------------------|---------|----------|-------|-------|
| 0001 | Site work | **CLOSED** | baseline live | n/a | `apps/site/` (WSX docs) | — | Umbrella → child RFCs; [completed/0001](rfc/completed/0001-site-work.md) |
| 0002 | Conversion umbrella | **CLOSED** | — | — | — | — | Umbrella → 0017–0025, 0033–0039; [completed/0002](rfc/completed/0002-conversion-tools.md) |
| 0003 | Editing umbrella | **CLOSED** | — | — | — | — | Umbrella → 0006–0016, 0026, 0030–0032, 0040–0041, 0044–0045; [completed/0003](rfc/completed/0003-editing-organization-tools.md) |
| 0004 | Optimize/security umbrella | **CLOSED** | — | — | — | — | Child RFCs generated; [completed/0004](rfc/completed/0004-optimization-security-advanced-tools.md) |
| 0005 | i18n | **MOVED OUT** | ilovepdf / gopdf.fyi | n/a | removed from OSS | — | Product `use-intl` stack; site uses i18next only |
| 0057 | WASM Worker arch | **CLOSED** | n/a | Worker + 4 ops | `packages/engine` | compress only | Architecture RFC closed 2026-07-11; [completed/0057](rfc/completed/0057-rust-wasm-engine-architecture.md) |
| 0058 | Engine plugin layering | **CLOSED** | n/a | see L1 column | docs + layers | export guards ✓ | Architecture RFC closed 2026-07-11; impl → [0059](rfc/0059-pdf-object-layer.md) · [PUBLISHING](../docs/PUBLISHING.md) |

### Shipped tools (`completed/`) — OSS npm surface

| ID | Tool | Verdict | Monorepo | Vitest | Browser e2e | OSS gap |
|----|------|---------|----------|--------|-------------|---------|
| 0006 | Merge | **PARTIAL** | `plugin-struct` + engine | ✓ | ✓ `all-tools` | npm `dist` |
| 0007 | Split | **PARTIAL** | same | ✓ | ✓ | npm `dist` |
| 0009 | Rotate | **PARTIAL** | same | ✓ | ✓ | npm `dist` |
| 0010 | Organize | **PARTIAL** | same | ❌ | ✓ | Vitest + npm `dist` |
| 0011 | Crop | **PARTIAL** | same | ❌ | ✓ | Vitest + npm `dist` |
| 0012 | Edit | **PARTIAL** | `plugin-annotate` | ✓ | ✓ | npm `dist` |
| 0013 | Sign | **PARTIAL** | `plugin-struct` | ❌ | ✓ | Vitest + npm `dist` |
| 0014 | Watermark | **PARTIAL** | same | ✓ | ✓ | npm `dist` |
| 0015 | Page numbers | **PARTIAL** | same | ❌ | ✓ | Vitest + npm `dist` |
| 0016 | Header/footer | **PARTIAL** | same | ❌ | ✓ | Vitest + npm `dist` |
| 0017 | JPG→PDF | **PARTIAL** | struct + engine WASM | ✓ | ✓ | npm `dist` |
| 0018 | PDF→JPG | **PARTIAL** | engine `renderPage` | ✓ | ✓ | npm `dist` |
| 0020 | OCR | **PARTIAL** | `plugin-extract` / engine | partial | ❌ no demo | demo + e2e + npm `dist` |
| 0021 | Protect | **PARTIAL** | `plugin-struct` | ✓ | ✓ | npm `dist` |
| 0022 | Unlock | **PARTIAL** | same | ✓ | ✓ | npm `dist` |

### Active — WASM / verified

| ID | Tool | Verdict | Consumer (ilovepdf) | WASM L1 | Monorepo | Tests | Notes |
|----|------|---------|---------------------|---------|----------|-------|-------|
| 0008 | Compress | **PARTIAL** | live | **P1 DONE** `compress_pdf` | `@gopdfjs/engine` + demo | ✅ E2E + `cargo test` | **P2 NOT STARTED** (image re-encode; needs object parser) |

### Active — WASM coded but RFC still Proposed (drift)

| ID | Tool | Verdict | Consumer (ilovepdf) | WASM L1 | Monorepo | Tests | Notes |
|----|------|---------|---------------------|---------|----------|-------|-------|
| 0028 | Grayscale | **PARTIAL** | unknown | **stub** `grayscale_pdf` | `@gopdfjs/engine` Worker API | ❌ | RFC §6 + 0058 aligned 2026-06-28 |
| 0042 | Web optimize | **PARTIAL** | unknown | **stub** `linearize_pdf` | `@gopdfjs/engine` Worker API | ❌ | RFC §6 + 0058 aligned 2026-06-28 |

### Active — proposed (not started in repo)

| ID | RFC | Verdict | Consumer (ilovepdf) | WASM L1 | Notes |
|----|-----|---------|---------------------|---------|-------|
| 0019 | PDF→Word | **NOT STARTED** | may ship L3 MVP | ❌ `pdf_to_docx` | L1 not started; see RFC §9 |
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
| 0061 | Understand PDF | **PARTIAL** | **live** L3 | ❌ `analyze_pdf` | L1 `@gopdfjs/plugin-inspect` planned; see RFC §5 |

### Deferred (`pending/`)

| ID | RFC | Verdict | Notes |
|----|-----|---------|-------|
| 0046 | AI summarizer | **DEFERRED** | Needs local / privacy-safe inference |
| 0047 | Chat with PDF | **DEFERRED** | same |
| 0048 | AI translate | **DEFERRED** | same |

Reserved: **0060**.

---

## Roll-up counts

| Verdict | Count | RFC IDs (summary) |
|---------|-------|---------------------|
| **DONE** (strict OSS) | 0 | — npm `dist` + publish blocks all tools |
| **DONE** (0008 P1 only) | 1 | 0008 Phase 1 — WASM + dedicated e2e |
| **PARTIAL** | 18 | 0006–0018, 0020–0022, 0008 P2, 0028, 0042, 0035?, 0061 |
| **CLOSED** | 6 | 0001–0004 umbrellas · 0057 · 0058 architecture |
| **NOT STARTED** | 29 | 0019, 0023–0027, 0029–0034, 0036–0041, 0043–0045, 0049–0056, 0059 |
| **DEFERRED** | 3 | 0046–0048 |

---

## RFC index (paths)

| ID | RFC | Doc status | Location |
|----|-----|--------------|----------|
| 0001 | [Site work](rfc/completed/0001-site-work.md) | Closed | completed |
| 0002 | [Conversion umbrella](rfc/completed/0002-conversion-tools.md) | Closed | completed |
| 0003 | [Editing umbrella](rfc/completed/0003-editing-organization-tools.md) | Closed | completed |
| 0004 | [Optimize/security umbrella](rfc/completed/0004-optimization-security-advanced-tools.md) | Closed | completed |
| 0005 | [i18n](rfc/completed/0005-multi-language-support.md) | Moved out | completed |
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
| 0057 | [WASM Worker](rfc/completed/0057-rust-wasm-engine-architecture.md) | Closed | completed |
| 0058 | [Engine layering](rfc/completed/0058-engine-plugin-charter.md) | Closed | completed |
| 0059 | [PDF Object Layer](rfc/0059-pdf-object-layer.md) | Proposed | active |
| 0061 | [Understand PDF](rfc/0061-understand-pdf.md) | Implemented (L3) / Planned (L1) | active |

*(Full paths for 0023–0056: see `.spec/rfc/` listing.)*

---

## Phases (what’s next)

| Phase | Focus | State |
|-------|--------|-------|
| **A** | **npm publish prep** | `dist/` build · exports · un-`private` · Vite WASM docs |
| **B** | Verification | Vitest gaps · OCR demo/e2e · Node adapter (0058 §3.4) |
| **C** | WASM truth | 0028/0042 stubs · PDF Object Layer |
| **D** | 0008 P2 | Image re-encode after parser |
| **E** | Proposed queue | 0019, 0061, then 0023+ |
| **F** | Deferred AI | 0046–0048 |

## RFC conventions

- **Active**: `.spec/rfc/NNNN-kebab-slug.md`
- **Closed**: `.spec/rfc/completed/` — **every** finished RFC (tool · umbrella · architecture)
- **Deferred**: `.spec/rfc/pending/`
- **Tasks**: [TASK_TRACKING.md](TASK_TRACKING.md) · publish gates: [PUBLISHING.md](../docs/PUBLISHING.md)

### RFC lifecycle (all types — no exemptions)

**Charter / umbrella are names, not a different lifecycle.** An RFC is an RFC.

1. **One concern** per file — no mono RFC mixing architecture + implementation backlog + publish checklist.
2. **Close** when that concern’s spec job is done → `Status: Closed (…)` + `Closed: YYYY-MM-DD` → `completed/`.
3. **Cannot close?** You wrote a mono RFC → **split** child RFCs (e.g. [0059](rfc/0059-pdf-object-layer.md)) or move work to TASK_TRACKING / PUBLISHING — then close the parent.
4. **Never reopen** — new scope → new RFC **0062+** or amend a child.

| Label | Close when |
|-------|------------|
| **Umbrella** (0001–0004) | Coverage map rows all point at existing child RFC files |
| **Architecture** (0057, 0058) | Architecture accepted and encoded in repo |
| **Tool** (0006+) | Per OSS gate in PUBLISHING + tool RFC §6 |
