# GoPDF.js — engine + plugin PDF library

**`@gopdfjs/engine`** is the **only consumer-facing API**. Host creates an **adapter** (low-level env ports), passes it to **`createEngine(adapter)`**, calls **`engine.compressPdf()`** etc.

## Four roles

```
Consumer  →  engine.*()           (@gopdfjs/engine — public API)
                 ↓ wires
              plugin-*             (@gopdfjs/plugin-shrink, plugin-extract, …)
                 ↓ receives
              GopdfRuntime         (@gopdfjs/runtime — engine → plugin API)
                 ↓ built from (inside engine)
              GopdfAdapter         (@gopdfjs/adapter — host low-level ports)
```

| Role | Package | Who uses it |
|------|---------|-------------|
| **Engine** | `@gopdfjs/engine` | Apps, demo, CLI — `createEngine(adapter)` → `Gopdf` |
| **Runtime** | `@gopdfjs/runtime` | `plugin-*` only — capability API from engine |
| **Adapter** | `@gopdfjs/adapter` + `adapter-browser` / `adapter-node` | Engine only — WASM, pdf.js, canvas, OCR |
| **Plugin** | `@gopdfjs/plugin-*` | Engine only — feature logic; consumer API assembled here |

Engine **builds runtime from adapter** and **exposes plugin methods as `Gopdf`**. Products never import `plugin-*` or `adapter` directly.

Design: `.spec/rfc/0058-engine-plugin-charter.md` · WASM: `.spec/rfc/0057-rust-wasm-engine-architecture.md`.

## Packages

| Layer | Package | Role |
|-------|---------|------|
| **Consumer API** | `@gopdfjs/engine` | `createEngine(adapter)` → `Gopdf` |
| **Adapters** | `@gopdfjs/adapter-browser` · `@gopdfjs/adapter-node` | Host creates `GopdfAdapter` |
| **Adapter contracts** | `@gopdfjs/adapter` | Port types — adapter authors + engine |
| **Shared model** | `@gopdfjs/model` | `PdfDocument`, `CanvasSurface` |
| **Runtime contracts** | `@gopdfjs/runtime` | `GopdfRuntime` — plugins only |
| **Plugin contracts** | `@gopdfjs/plugin` | Domain options/results |
| **Plugins** | `@gopdfjs/plugin-shrink`, `plugin-extract`, … | Wired inside engine |
| WASM | `@gopdfjs/wasm` | `rust/` → `crates/gopdf-*` · single `pkg/` (web target) | adapters init |

### Public API (consumer)

```ts
import { createBrowserGopdf } from "@gopdfjs/adapter-browser";
// or: import { createNodeGopdf } from "@gopdfjs/adapter-node";

const engine = await createBrowserGopdf();
const out = await engine.compressPdf(inputBytes, "recommended", (p) => {
  console.log("progress", p);
});
```

All §2.6 tools live on `Gopdf` — implemented by `plugin-*`, exposed by `createEngine`. Type: `@gopdfjs/engine` (`Gopdf`). Compare (RFC 0053): `engine.comparePdfText()` · `engine.createCompareSession()`.

## Install & use (app code)

In this monorepo, depend on **`@gopdfjs/adapter-browser`** or **`@gopdfjs/adapter-node`** plus **`@gopdfjs/engine`** via `workspace:*` (see `apps/demo`).

Browser (Vite/React or any bundler with Worker + WASM support):

```ts
import { createBrowserGopdf } from "@gopdfjs/adapter-browser";

const engine = await createBrowserGopdf();
await engine.analyzePdf(pdfBytes);
await engine.compressPdf(pdfBytes, "recommended");
```

Node:

```ts
import { createNodeGopdf } from "@gopdfjs/adapter-node";

const engine = await createNodeGopdf();
await engine.pdfToText(pdfBytes, { format: "txt" });
```

Terminal CLI without embedding the library: separate [`gopdf-cli`](https://github.com/gopdfjs/gopdf-cli) repo (`gopdf compress`, `gopdf mcp`, `gopdf install cursor`, …).

## Build the WASM binary (contributors)

Prerequisites: **Rust**, target **`wasm32-unknown-unknown`**, and **`wasm-pack`**.

```bash
pnpm install
pnpm build:wasm        # release → adapter-browser/pkg + adapter-node/pkg
pnpm build:wasm:dev    # faster iteration
```

Without a successful `build:wasm`, adapter WASM init will fail at runtime.

## Monorepo layout

| Path | Purpose |
|------|---------|
| **`crates/gopdf-*`** | Rust PDF algorithms |
| **`packages/wasm/rust`** | `wasm-bindgen` `cdylib` → single `pkg/`; adapters init per host |
| **`packages/engine`** | `createEngine` facade |
| **`packages/adapter-*`** | Browser / Node env bundles |
| **`packages/adapter`**, **`runtime`**, **`plugin`**, **`model`** | Shared contracts |
| **`packages/plugin-*`** | Plugin domains (engine-internal) |
| **`apps/demo`** | Browser smoke + Playwright e2e |
| **`apps/site`** | CLI docs landing (GitHub Pages) |
| **CLI** | [`gopdf-cli`](https://github.com/gopdfjs/gopdf-cli) — standalone repo |

```bash
pnpm dev          # monorepo dev
pnpm build        # turbo build
pnpm build:wasm   # wasm-pack → adapter-*/pkg
pnpm test:rust    # cargo test --workspace
pnpm test         # test:rust + turbo vitest
pnpm test:e2e     # Playwright (apps/demo/e2e)
pnpm validate     # test + lint + build
```

## Documentation

- **Publishing**: [docs/PUBLISHING.md](./docs/PUBLISHING.md)
- **Roadmap**: [.spec/ROADMAP.md](./.spec/ROADMAP.md)
- **Tasks**: [.spec/TASK_TRACKING.md](./.spec/TASK_TRACKING.md)
- **RFC specs**: `.spec/rfc/` — `completed/`, `pending/`, `rejected/`

GoPDF.js ships **`@gopdfjs/*` npm packages** for local, private PDF processing in browser and Node.
