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

Engine **bundles** internal `@gopdfjs/*` at publish build — consumers do not add `@gopdfjs/plugin-shrink` etc.

## OSS publish gate (this repo)

| Gate | Command / artifact |
|------|---------------------|
| Public export guards | `pnpm check:public-exports` · `check:layer-deps` |
| Vite publish sanity | **`pnpm check:vite-sanity`** — manual / pre-release only (not in `pnpm release -y`) |
| Unit tests | `pnpm test` · `pnpm test:rust` |
| Browser acceptance | `pnpm test:e2e` |
| Build | `dist/` via **Vite library mode** on the **3 public** packages |
| npm metadata | `publishConfig.access: public` on those 3 only |

**Not in this repo:** `gopdf-cli` subcommands · MCP install · ilovepdf UI.

## Local dev — `@systembug/pangu`

Root **`pangu.config.json`** lists workspace demos (`package` must have a `"dev"` script; `value` is the CLI arg):

```bash
pnpm build:wasm   # once
pnpm dev          # interactive menu
pnpm dev demo     # direct — browser acceptance (@gopdfjs/demo-react)
pnpm dev site     # direct — docs landing (@gopdfjs/site)
```

Never `pnpm dev dev` — second arg is the demo **value** from config, not the script name.

Public packages expose **`exports.development` → `./src/*.ts`**. Vite resolves source directly — **no `dist/` build for local dev**.

## Release — `@systembug/qingniao` + changesets

Tooling (root `package.json`):

```json
"dev": "pangu",
"release": "qingniao",
"changeset": "changeset"
```

**One-time setup** (already done in repo):

```bash
pnpm add -D @systembug/pangu @systembug/qingniao @changesets/cli
pnpm exec qingniao changeset-init
```

Optional **`qingniao.config.json`**: `{ "publish": { "skipExisting": true } }`.

**`.changeset/config.json`** — three public packages in **`fixed`** (lockstep version); all private workspace packages in **`ignore`**.

### Release flow (maintainer)

1. Optional manual gates: `pnpm check:vite-sanity` · `pnpm test:e2e`
2. `pnpm changeset` — describe bump; creates `.changeset/*.md`
3. `git add .changeset && git commit -m "chore: changeset"`
4. `git push`
5. `pnpm login` (if needed)
6. **`pnpm release -y`** in your terminal — NPM 2FA OTP must be entered interactively here
7. Verify:

```bash
npm view @gopdfjs/engine version
npm view @gopdfjs/adapter-browser version
npm view @gopdfjs/adapter-node version
```

`package.json` version + CHANGELOG must match after `changeset version` (qingniao runs this in the release pipeline).

**Before first publish:** `@gopdfjs/*` return 404 on npm until the first successful release.

## Automated guards

- `pnpm check:layer-deps` — `plugin-*` prod deps must not pull `@gopdfjs/adapter*` / `engine`
- `pnpm check:public-exports` — engine exports only `"."`; adapter barrels must not re-export engine/plugins/WASM
- `pnpm check:vite-sanity` — **manual only** (not in qingniao release); builds 3 public packages; no private `@gopdfjs/*` in published JS/d.ts

## Bundler guidance (browser consumers)

Mirror `apps/demo/vite.config.ts`:

```ts
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
  plugins: [wasm(), topLevelAwait()],
  optimizeDeps: { exclude: ["@gopdfjs/engine"] },
  worker: { format: "es", plugins: () => [wasm(), topLevelAwait()] },
});
```

WASM ships inside `@gopdfjs/adapter-browser` / `@gopdfjs/adapter-node` tarballs (vendored `.wasm` in `dist/`). See RFC 0057 §4.3.

## Versioning

Lockstep `0.x` for the 3 public packages (`fixed` in `.changeset/config.json`) until API freeze.
