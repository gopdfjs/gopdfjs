# Publishing `@gopdfjs/*`

RFC 0058 §2.2 / §3.5 — **this repo ships npm libraries only.**  
CLI + MCP → **[`gopdf-cli`](https://github.com/gopdfjs/gopdf-cli)** (separate repo — **not** an OSS gate).

## Golden rule

**All product features via `engine.*()` on `Gopdf`.** Apps **never** import `@gopdfjs/plugin-*`, `@gopdfjs/runtime`, `@gopdfjs/wasm`, etc.

```ts
import { createBrowserGopdf } from "@gopdfjs/adapter-browser";
const engine = await createBrowserGopdf();
await engine.compressPdf(bytes, "recommended");
```

## v1 public npm — install these three only

| Package | Apps import |
|---------|-------------|
| `@gopdfjs/engine` | `Gopdf` types + `engine.*()` |
| `@gopdfjs/adapter-browser` | `createBrowserGopdf()` |
| `@gopdfjs/adapter-node` | `createNodeGopdf()` |

**Not v1 public:** `@gopdfjs/adapter` (custom adapter story not ready).

## Monorepo-internal — `private: true`, not consumer npm

RFC 0058 §2.1 — implementation stays in repo; **禁止产品 import**:

| Path | Role |
|------|------|
| `@gopdfjs/plugin-*` | Feature impl — engine wires only |
| `@gopdfjs/runtime` | Plugin capability API |
| `@gopdfjs/plugin` | Domain types |
| `@gopdfjs/model` | Shared shapes |
| `@gopdfjs/adapter` | Port contracts (engine + adapters) |
| `@gopdfjs/wasm` | WASM bindgen `pkg/` |
| `@gopdfjs/fixtures` | Dev/e2e only |

Engine **bundles or workspace-resolves** plugins at build time — consumers do not add `@gopdfjs/plugin-shrink` etc.

## OSS publish gate (this repo)

| Gate | Command / artifact |
|------|---------------------|
| Public export guards | `pnpm check:public-exports` · `check:layer-deps` |
| Unit tests | `pnpm test` · `pnpm test:rust` |
| Browser acceptance | `pnpm test:e2e` |
| Build | `dist/` via **Vite library mode** on the **3 public** packages |
| npm metadata | `publishConfig.access: public` on those 3 only |

**Not in this repo:** `gopdf-cli` subcommands · MCP install · ilovepdf UI.

## Current state

| Gate | Status |
|------|--------|
| `pnpm check:public-exports` | ✓ |
| `pnpm check:layer-deps` | ✓ |
| `createEngine` covers `Gopdf` (§2.6) | ✓ |
| Browser e2e | ✓ |
| `dist/` on engine + adapters | **Todo** |
| Engine bundles internal deps for npm | **Todo** (Vite lib build) |

## Monorepo dev (Vite)

Public packages expose **`exports.development` → `./src/*.ts`**. Vite (demo, site) resolves source directly — **no `dist/` build for local dev**.

```bash
pnpm build:wasm   # once
pnpm dev demo     # Vite + HMR on workspace packages
```

Publish build (`pnpm --filter=@gopdfjs/engine build`) uses the same Vite toolchain in **library mode** — not a separate bundler.

## Before first npm publish (3 packages only)

1. `engine` build bundles `@gopdfjs/plugin-*` + runtime deps (no separate plugin npm installs for consumers).
2. `adapter-browser` / `adapter-node` ship WASM + boot helpers; `pnpm build:wasm` first.
3. `exports` → `dist/` on the 3 public packages only.
4. `publishConfig.access: public` — **only** engine · adapter-browser · adapter-node.

## Automated guards

- `pnpm check:layer-deps` — `plugin-*` prod deps must not pull `@gopdfjs/adapter*` / `engine`
- `pnpm check:public-exports` — engine exports only `"."`; adapter barrels must not re-export engine/plugins/WASM

## Bundler guidance (browser consumers)

Your app already uses Vite — mirror `apps/demo/vite.config.ts`:

```ts
// vite.config.ts — same as apps/demo
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
  plugins: [wasm(), topLevelAwait()],
  optimizeDeps: { exclude: ["@gopdfjs/engine"] },
  worker: { format: "es", plugins: () => [wasm(), topLevelAwait()] },
});
```

**Monorepo / linked packages:** `exports.development` points at TypeScript source; Vite picks it up in dev without prebuilding `dist/`.

WASM asset: `@gopdfjs/wasm/gopdf_wasm_bg.wasm` (resolved via adapter-browser). See RFC 0057 §4.3.

## Versioning

Lockstep `0.x` for the 3 public packages until API freeze.
