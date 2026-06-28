# GoPDF RFC Index

**North Star**: [browser-only PDF tool site — zero server application code](../../AGENTS.md#产品目标north-star).

RFCs live under tier folders. A tool graduates to `ready/` only when **unit + Playwright E2E** gates pass (`verified: true` in frontmatter).

## Tiers

| Folder | Meaning |
|--------|---------|
| `charter/` | Site vision, umbrellas, WASM architecture (0057, 0058) |
| `ready/` | Shipped **and** verified (100% unit + E2E for public API) |
| `implemented/` | Code exists; tests incomplete (`verified: false`) |
| `proposed/` | Not shipped |
| `pending/` | Deferred (browser-only path not ready, e.g. AI 0046–0048) |

## Rust layout (workspace)

| Crate | Role |
|-------|------|
| `crates/gopdf-compress` | RFC 0008 Phase 1 |
| `crates/gopdf-image` | RFC 0017/0018/0028 |
| `crates/gopdf-linearize` | RFC 0042 |
| `crates/pdf-wasm` | Thin `wasm-bindgen` facade |
| `packages/pdf-wasm` | Thin JS Worker proxy only |
| `packages/tools` | Product-facing orchestration (`runCompressPdf`, stats, …) |

Build WASM: `pnpm build:wasm`（根目录）· Rust tests: `pnpm test:rust` · JS tests: `pnpm --filter=@gopdfjs/tools test` · E2E: `pnpm test:e2e`

## Inventory

### charter/

| RFC | Title |
|-----|-------|
| 0001 | Site work |
| 0002 | Conversion tools (umbrella) |
| 0003 | Editing & organization (umbrella) |
| 0004 | Optimization & security (umbrella) |
| 0005 | Multi-language (i18n) |
| 0057 | Rust/WASM Worker architecture |
| 0058 | WASM PDF library charter |

### ready/

| RFC | Title | Tests |
|-----|-------|-------|
| 0008 | Compress PDF | `cargo test` (gopdf-compress) + `@gopdfjs/tools` Vitest + `.spec/e2e/tools/compress.spec.ts` |

### implemented/ (unverified)

0006 Merge · 0007 Split · 0009 Rotate · 0010 Organize · 0011 Crop · 0012 Edit · 0013 Sign · 0014 Watermark · 0015 Page numbers · 0016 Header/footer · 0017 JPG→PDF · 0018 PDF→JPG · 0020 OCR · 0021 Protect · 0022 Unlock

### proposed/

0019, 0023–0045, 0049–0056, 0061 (see folder listing)

### pending/

0046 AI summarizer · 0047 Chat with PDF · 0048 AI translate

## New RFC

Copy `_template.md`, pick the next free number, place in `proposed/` until implementation starts.
