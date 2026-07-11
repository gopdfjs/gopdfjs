# Publishing `@gopdfjs/*`

RFC 0058 §2.2 / §3.5 — npm scope **`@gopdfjs`**. CLI + MCP install → **[`gopdf-cli`](https://github.com/gopdfjs/gopdf-cli)** (not this repo).

## Golden rule

**All product features via `engine.*()` on `Gopdf`.** No `@gopdfjs/plugin-*` imports in apps. No `loadDocument` / `encodeImages` on consumer surface.

```ts
import { createBrowserGopdf } from "@gopdfjs/adapter-browser";
const engine = await createBrowserGopdf();
await engine.compressPdf(bytes, "recommended");
```

## Consumer import map (v1 — only these three)

| Need | Import from |
|------|-------------|
| `engine.compressPdf()` … all §2.6 tools | `@gopdfjs/engine` (`Gopdf` types; `createEngine` exists but not the default app path) |
| Browser | `@gopdfjs/adapter-browser` → `createBrowserGopdf()` |
| Node | `@gopdfjs/adapter-node` → `createNodeGopdf()` |

**Not public / not ready for apps:**

| Package | Status |
|---------|--------|
| `@gopdfjs/adapter` | Internal — engine + `adapter-*` only. Custom `GopdfAdapter` / `createBrowserAdapter()` story **not** v1 public. |
| `@gopdfjs/files` | Not ready — use native `File.arrayBuffer()` in apps. |

**Never consumer-facing:** `@gopdfjs/wasm`, `@gopdfjs/runtime`, `@gopdfjs/model`, `@gopdfjs/plugin`, `@gopdfjs/plugin-*`, `@gopdfjs/fixtures`, `@gopdfjs/render`.

## Package inventory (`packages/`)

| Package | Role | Publish? |
|---------|------|----------|
| `@gopdfjs/engine` | Consumer facade — `createEngine()` wires plugins | **Yes** (primary) |
| `@gopdfjs/adapter-browser` | Browser `GopdfAdapter` + `createBrowserGopdf()` | **Yes** |
| `@gopdfjs/adapter-node` | Node `GopdfAdapter` + `createNodeGopdf()` | **Yes** |
| `@gopdfjs/adapter` | Port types — engine + `adapter-*` only | **Yes** (transitive; **not** v1 consumer import) |
| `@gopdfjs/files` | `readFileAsArrayBuffer` stub | **No** — not ready |
| `@gopdfjs/wasm` | Single `pkg/` (web target); adapters init | **Yes** (transitive) |
| `@gopdfjs/runtime` | `GopdfRuntime` — plugins only | **Yes** (transitive) |
| `@gopdfjs/plugin` | Domain option/result types | **Yes** (transitive) |
| `@gopdfjs/model` | `PdfDocument`, `CanvasSurface` | **Yes** (transitive) |
| `@gopdfjs/plugin-shrink` | compress | **Yes** (transitive) |
| `@gopdfjs/plugin-grayscale` | grayscale | **Yes** (transitive) |
| `@gopdfjs/plugin-struct` | merge, split, rotate, … | **Yes** (transitive) |
| `@gopdfjs/plugin-extract` | pdfToWord, extractImages, … | **Yes** (transitive) |
| `@gopdfjs/plugin-repair` | repairPdf | **Yes** (transitive) |
| `@gopdfjs/plugin-redact` | redactPdf | **Yes** (transitive) |
| `@gopdfjs/plugin-annotate` | applyEdits | **Yes** (transitive) |
| `@gopdfjs/plugin-author` | htmlToPdf, markdownToHtml | **Yes** (transitive) |
| `@gopdfjs/plugin-inspect` | analyzePdf | **Yes** (transitive) |
| `@gopdfjs/plugin-compare` | compare (engine-only) | **Yes** (transitive) |
| `@gopdfjs/render` | pdf.js canvas helpers — **no workspace deps** | **No** — wire into adapter or delete before v1 |
| `@gopdfjs/fixtures` | Test PDFs | **Never** |

Apps (`apps/demo`, `apps/site`) stay **private**.

## Current state (pre-publish)

| Gate | Status |
|------|--------|
| `pnpm check:public-exports` | ✓ |
| `pnpm check:layer-deps` | ✓ |
| `createEngine` covers `Gopdf` (§2.6) | ✓ — compare on engine, no `loadDocument` leak |
| Browser e2e (`pnpm test:e2e`) | ✓ (34/34) |
| `"private": true` on all publishable pkgs | **Blocker** — remove per package at release |
| `dist/` JS + `.d.ts` build | **Blocker** — not defined; exports still point at `src/` |
| `exports` → `dist/` only (RFC §3.5) | **Blocker** |
| Bundler WASM docs (Vite/webpack) | **Todo** — § below |
| `@gopdfjs/render` orphan | **Todo** — integrate or remove |

## Before first npm publish (each package)

1. Add `build` → `dist/` (JS + `.d.ts`). Monorepo convention TBD (`tsup` / `tsc` — pick one shared config).
2. Rewrite `package.json` `exports` / `main` / `types` to `dist/` paths only.
3. Set `"files": ["dist"]` (+ `pkg/` for `@gopdfjs/wasm`).
4. Remove `"private": true` or use `"publishConfig": { "access": "public" }`.
5. Run `pnpm build:wasm` before publishing adapters.

## Publish order

Avoid dev-only engine ↔ adapter cycle at **runtime** (pnpm tolerates it in workspace):

```
model → plugin → runtime → adapter
  → wasm (pnpm build:wasm)
  → plugin-* (any order)
  → engine
  → adapter-browser · adapter-node
```

`engine` lists adapters in `devDependencies` (tests only). Adapters depend on `engine` at runtime for `createBrowserGopdf()` — publish adapters **after** engine.

## Automated guards (`pnpm test` / CI)

- `pnpm check:layer-deps` — `plugin-*` prod deps must not pull `@gopdfjs/adapter*` / `engine`
- `pnpm check:public-exports` — engine exports only `"."`; adapter barrels must not re-export engine/plugins/WASM ports

## Bundler guidance (browser)

Hosts bundling `@gopdfjs/adapter-browser` need:

- Top-level `await` (WASM init)
- WASM asset resolution for `@gopdfjs/wasm/gopdf_wasm_bg.wasm`

Document concrete Vite / webpack snippets here before v1. See RFC 0057 §4.3.

## Versioning

- Lockstep `0.x` until first stable API freeze, or independent semver per package (prefer lockstep for `plugin-*` + `engine`).
- Changelog: TBD (`CHANGELOG.md` per package or monorepo root).
