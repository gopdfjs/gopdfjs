# Task tracking

Operational tasks linked to [ROADMAP.md](ROADMAP.md). Mark **Done** when merged to `main`.

## Goal

**Publish `@gopdfjs/engine` + adapters to npm.** OSS gates only — **not** `gopdf-cli` (separate repo).

## Full picture (one screen)

```
PUBLISH    dist/ build · exports → dist · un-private · Vite WASM docs
PARTIAL    0006–0022 npm coded; global blocker = npm dist
PARTIAL    0028 0042 WASM stubs
CLOSED     0057 0058 architecture RFCs → completed/
NOT START  0023–0027 0029–0034 0036–0041 0043–0045 0049–0056 0059
DEFERRED   0046–0048 AI
E2E        all-tools matrix ✅ (except OCR — no demo route)
VITEST GAP organize · crop · sign · page-numbers · header-footer
PUBLISH    docs/PUBLISHING.md checklist
```

---

## rfc-workflow (agents)

1. Read RFC → [ROADMAP snapshot](ROADMAP.md#full-implementation-snapshot-2026-07-11)
2. User picks scope
3. Plan → explicit `yes` before code
4. Status change → update this file + ROADMAP + RFC header same PR

**Never** count `gopdf-cli` subcommands as OSS partial/DONE.

---

## Done

- [x] RFC layout: flat `.spec/rfc/` + `completed/` + `pending/`
- [x] ROADMAP + TASK_TRACKING
- [x] 0001–0004 umbrellas closed
- [x] 0057 · 0058 architecture RFCs closed → `completed/` (2026-07-11); mono bits split to 0059 + TASK_TRACKING + PUBLISHING
- [x] 0008 P1: `compress_pdf` + `cargo test` + compress e2e
- [x] WASM exports: compress · encode · grayscale* · linearize* (*stubs)
- [x] L3 `plugin-*` wired via `@gopdfjs/engine`
- [x] `gopdf-cli` migrated out — not in this repo
- [x] Legacy `packages/files` + `packages/render` removed
- [x] Public API: 3 consumer pkgs (engine + adapter-browser + adapter-node)
- [x] `all-tools.spec.ts` e2e matrix (demo registry)
- [x] `check:public-exports` + `check:layer-deps`
- [x] completed/0006–0022 §6 Implementation status
- [x] ROADMAP: CLI stripped from OSS verdict (2026-07-11)

## In progress — P0 publish

- [ ] **Shared `dist/` build** (Vite lib mode) for the 3 public `@gopdfjs/*` packages
- [ ] **`exports` → `dist/`** — no `src/` in published packages
- [ ] **`dist/` + `publishConfig`** — **only** `@gopdfjs/engine` · `adapter-browser` · `adapter-node`
- [ ] **`plugin-*` stay `private: true`** — monorepo internal; engine bundles for npm (RFC 0058)
- [ ] **Vite/webpack WASM bundler docs** in `docs/PUBLISHING.md`
- [ ] **CHANGELOG** + version bump strategy

## In progress — P1 verification (OSS)

- [ ] Plugin Vitest: organize · crop · sign · page-numbers · header-footer
- [ ] OCR demo route + e2e (RFC 0020)
- [ ] Node adapter coverage (TASK_TRACKING P1 — was 0058 §3.4)
- [ ] `pnpm test:e2e` green in CI

## To do — P2 (WASM depth)

- [ ] PDF Object Layer ([RFC 0059](rfc/0059-pdf-object-layer.md))
- [ ] 0008 P2 image re-encode
- [ ] 0028 / 0042 full WASM (not stub)
- [ ] 0019 L1 · 0061 L1

## To do — P3 (proposed backlog)

0023–0027 · 0029–0034 · 0036–0041 · 0043–0045 · 0049–0056 — Approved + rfc-workflow first.

## Deferred

0046–0048 — browser-only AI

## Review queue

Next audit: **P0 publish** (`dist/` pipeline) or first open tool RFC.
