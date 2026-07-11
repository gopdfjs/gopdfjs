---
name: gopdf-vite-sanity
description: >-
  Vite publish sanity for GoPDF npm packages. Use before npm publish, after
  vite.config or package.json exports changes, or when auditing dist/ leaks.
  Enforces 3 public packages only (engine + adapters), no plugin-* on npm.
---

# GoPDF Vite publish sanity

**Golden rule:** consumers install **3 packages only** — `@gopdfjs/engine`, `@gopdfjs/adapter-browser`, `@gopdfjs/adapter-node`. All features via `engine.*()`. **`plugin-*` / runtime / model / adapter / wasm = `private: true` — never public npm.**

Publish toolchain = **Vite lib mode only** (no tsup, no `tsconfig.build.json`).

## Run

From repo root:

```bash
node .claude/skills/gopdf-vite-sanity/scripts/vite-sanity-check.mjs
# or
pnpm check:vite-sanity
```

Optional manual steps after script:

```bash
pnpm build:wasm   # before adapter pack if wasm vendoring not yet in dist
pnpm --filter=@gopdfjs/engine --filter=@gopdfjs/adapter-browser --filter=@gopdfjs/adapter-node build
```

## What the script checks

| Check | Pass |
|-------|------|
| No `tsup` in repo | Vite only |
| `plugin-*` | all `private: true` |
| 3 public pkgs | `build: "vite build"` + `vite.config.ts` |
| Guards | `pnpm check:public-exports` · `check:layer-deps` |
| `engine/dist/index.js` | no `from "@gopdfjs/…"` runtime imports |
| `dist/index.d.ts` (all 3) | no imports from `@gopdfjs/adapter` · `plugin` · `wasm` · etc. |
| `engine` `dependencies` | npm packages only — no `@gopdfjs/*` |
| adapter `dependencies` | `@gopdfjs/engine` (+ pdfjs / node native) — **not** adapter/model/wasm |
| adapter tarball | if JS imports wasm → `.wasm` must be **inside** `dist/` (no 4th public wasm pkg) |
| `pnpm pack --dry-run` | `dist/index.js` in tarball |

## Dev vs publish (Vite)

| Mode | Resolution |
|------|------------|
| **Monorepo dev** (`pnpm dev demo`) | `exports.development` → `./src/*.ts` — no prebuild |
| **npm consumer** | `exports.import` → `./dist/index.js` |

Demo Vite config reference: `apps/demo/vite.config.ts` — `wasm()`, `topLevelAwait()`, `optimizeDeps.exclude: ["@gopdfjs/engine"]`.

## Common failures → fix

| Failure | Fix |
|---------|-----|
| `.d.ts` imports `@gopdfjs/plugin` | `vite-plugin-dts` `rollupTypes: true`; re-export types from public entry only |
| adapter `dependencies` has `@gopdfjs/wasm` | vendor wasm glue + `.wasm` into adapter `dist/`; drop wasm from published deps |
| `engine` lists `@gopdfjs/plugin-*` in `dependencies` | move to `devDependencies`; bundle in Vite `rollupOptions.external` |
| tsup / `tsconfig.build.json` | delete — one `tsconfig.json` (IDE/Vitest) + `vite.config.ts` |

## Not in scope

- Vitest gaps · OCR e2e · `gopdf-cli` · ilovepdf UI
- Making `plugin-*` public npm (forbidden)

## Related

- `docs/PUBLISHING.md` — consumer install story
- `.spec/scripts/check-public-exports.py` — barrel export guards
- Skill: `gopdf-e2e` — browser acceptance after npm surface changes
