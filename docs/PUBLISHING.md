# Publishing `@gopdfjs/*`

RFC 0058 §2.2 / §3.5 — **this repo ships npm libraries only.**  
CLI + MCP → **[`gopdf-cli`](https://github.com/gopdfjs/gopdf-cli)** (separate repo — **not** an OSS gate).

## Golden rule

**All product features via `engine.*()` on `Gopdf`.** Apps **never** import `@gopdfjs/plugin-*`, `@gopdfjs/runtime`, `@gopdfjs/wasm`, etc.

```ts
import { createEngine } from "@gopdfjs/engine";
import { createBrowserAdapter } from "@gopdfjs/adapter-browser";

const engine = createEngine(await createBrowserAdapter());
await engine.compressPdf(bytes, "recommended");
```

## v1 public npm — install these three only

| Package | Apps import |
|---------|-------------|
| `@gopdfjs/engine` | `createEngine(adapter)` + `Gopdf` types |
| `@gopdfjs/adapter-browser` | `createBrowserAdapter()` |
| `@gopdfjs/adapter-node` | `createNodeAdapter()` |

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
| Build | **Closed.** Vite library mode emits `dist/` for `@gopdfjs/engine`, `@gopdfjs/adapter-browser`, and `@gopdfjs/adapter-node` (`pnpm --filter=@gopdfjs/engine --filter=@gopdfjs/adapter-browser --filter=@gopdfjs/adapter-node build`). Not an open gap. |
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

`publishConfig.exports` drops that `development` condition. `pnpm pack` / npm publish therefore resolve only `./dist/*`. Packed consumers must not import `src/`. Check with `pnpm check:pack-exports`.

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

### Release flow

Routine releases go through GitHub Actions ([RFC 0062](../.spec/rfc/0062-github-actions-release-pipeline.md)). `develop` never runs `npm publish`.

1. Feature work lands on `develop` by pull request. The required check is the `verify` job in `.github/workflows/ci.yml` (`pnpm format:check`, `pnpm validate`, `pnpm test:e2e`). A diff under `packages/` or `crates/` must add a `.changeset/*.md` file.
2. Monday 15:00 UTC, `.github/workflows/promote-develop.yml` opens or updates `develop` → `main` and merge-commits it after `verify` is green. Re-run it with `workflow_dispatch` when you do not want to wait for Monday.
3. Push to `main` runs `.github/workflows/release.yml`. Pending changesets: `pnpm validate`, `pnpm check:vite-sanity`, then `pnpm exec qingniao --yes`. No pending changeset: the job exits 0 and does not publish. `workflow_dispatch` on this workflow is dry-run only.
4. After a publish, the workflow opens `main` → `develop` (`chore: back-merge release commits into develop`). Review that pull request; it is not auto-merged.
5. Verify:

Manual OTP stays the escape hatch when Actions cannot publish. In a terminal: `pnpm login` if needed, then **`pnpm release -y`**, and enter the NPM 2FA OTP at the prompt. Do not put an NPM token in the workflow to replace trusted publishing.

One-time repository setup (not in YAML):

| Setting | Value |
|---------|--------|
| Branch `develop` | Create from `main` after the pipeline files are on `main` |
| Secret `RELEASE_GITHUB_TOKEN` | Fine-grained PAT or GitHub App. Contents and pull requests: read/write. Its pushes must be allowed to trigger workflows. The default `GITHUB_TOKEN` will not start `release.yml` or `deploy-site.yml` after the weekly merge |
| Branch protection `develop` and `main` | Pull request required. Required check: `verify`. No force push |
| npm trusted publisher, each public package | This GitHub repository, workflow `release.yml`, action **`npm publish`** (not only `npm stage publish`) |

`actions/setup-node` in these workflows must not set `registry-url`. That writes a token `.npmrc` and hides OIDC.

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
- `pnpm check:pack-exports` — packs the 3 public packages and checks Node resolves `dist/` (including `--conditions=development`)

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
