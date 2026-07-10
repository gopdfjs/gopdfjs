# GoPDF.js — engine + plugin PDF library

**`@gopdfjs/engine`** is the sole consumer-facing API for PDF tools in browser and Node. You create an **adapter** for your environment, pass it to **`createEngine(adapter)`**, and call methods on the returned **`Gopdf`** facade (`engine.compressPdf()`, `engine.mergePdfs()`, …).

PDF bytes stay local: the engine clones host buffers at the facade boundary so you can reuse one `Uint8Array` across many calls. Rust/WASM accelerates selected ops inside adapters — it is **not** a top-level consumer API.

Design: `.spec/rfc/0058-engine-plugin-charter.md` · WASM layout: `.spec/rfc/0057-rust-wasm-engine-architecture.md`.

## What you get

| Layer | Package | Role |
|-------|---------|------|
| **Consumer API** | `@gopdfjs/engine` | `createEngine(adapter)` → `Gopdf` |
| **Adapters** | `@gopdfjs/adapter-browser` · `@gopdfjs/adapter-node` | Env ports: WASM, pdf.js, canvas, OCR (Node) |
| **Adapter contracts** | `@gopdfjs/adapter` | `GopdfAdapter`, port types, bytes helpers, `Gopdf` types |
| **Runtime contracts** | `@gopdfjs/runtime` | `GopdfRuntime`, `PdfDocument`, `CanvasSurface` (engine → plugins) |
| **Plugin contracts** | `@gopdfjs/plugin` | Domain options/results (`GrayscalePdfOptions`, …) |
| **Plugins** | `@gopdfjs/plugin-shrink`, `plugin-extract`, `plugin-struct`, … | Wired inside engine — **do not import from apps** |
| **Rust** | `crates/gopdf-*` → `packages/engine/pkg/` | Algorithms + `gopdf-wasm` (adapter-only `./pkg/*` subpath) |

### Public API (consumer)

```ts
import { createBrowserGopdf } from "@gopdfjs/adapter-browser";
// or: import { createNodeGopdf } from "@gopdfjs/adapter-node";

const engine = await createBrowserGopdf();
const out = await engine.compressPdf(inputBytes, "recommended", (p) => {
  console.log("progress", p);
});
```

All §2.6 tools live on `Gopdf` — merge, split, rotate, extract, repair, grayscale, etc. See `packages/adapter/src/gopdf.ts` for the full surface.

**Separate entry points** (intentional):

| Export | Role |
|--------|------|
| `@gopdfjs/engine/compare` | Token-level PDF compare |
| `@gopdfjs/engine/render` | `renderPageToJpeg` / `renderPageToPng` helpers |
| `splitEncodedImages` | Parse length-prefixed blobs from `encodeImages` |

`loadDocument` and `encodeImages` exist on `Gopdf` for engine/plugin wiring; they are not the primary consumer documentation surface.

## Install & use (app code)

In this monorepo, depend on **`@gopdfjs/adapter-browser`** or **`@gopdfjs/adapter-node`** plus **`@gopdfjs/engine`** via `workspace:*` (see `demos/react`).

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

Terminal CLI without embedding the library: separate [`gopdf-cli`](https://github.com/gopdfjs/gopdf-cli) repo.

## Build the WASM binary (contributors)

Prerequisites: **Rust**, target **`wasm32-unknown-unknown`**, and **`wasm-pack`**.

```bash
pnpm install
pnpm build:wasm        # release → packages/engine/pkg/
pnpm build:wasm:dev    # faster iteration
```

Without a successful `build:wasm`, adapter WASM init will fail at runtime.

## Monorepo layout

| Path | Purpose |
|------|---------|
| **`crates/gopdf-*`** | Rust PDF algorithms |
| **`crates/gopdf-wasm`** | `wasm-bindgen` `cdylib` → `packages/engine/pkg/` |
| **`packages/engine`** | `createEngine` facade |
| **`packages/adapter-*`** | Browser / Node env bundles |
| **`packages/ports`** | Shared contracts |
| **`packages/struct`**, **`shrink`**, **`grayscale`**, **`extract`**, … | Plugin domains (engine-internal) |
| **`demos/react`** | Browser smoke + Playwright e2e |
| **`site`** | CLI docs landing (GitHub Pages) |
| **CLI** | [`gopdf-cli`](https://github.com/gopdfjs/gopdf-cli) — standalone repo |

```bash
pnpm dev          # monorepo dev
pnpm build        # turbo build
pnpm build:wasm   # wasm-pack → packages/engine/pkg
pnpm test:rust    # cargo test --workspace
pnpm test         # test:rust + turbo vitest
pnpm test:e2e     # Playwright (demos/react/e2e)
pnpm validate     # test + lint + build
```

## Documentation

- **Publishing**: [docs/PUBLISHING.md](./docs/PUBLISHING.md)
- **Roadmap**: [.spec/ROADMAP.md](./.spec/ROADMAP.md)
- **Tasks**: [.spec/TASK_TRACKING.md](./.spec/TASK_TRACKING.md)
- **RFC specs**: `.spec/rfc/` — `completed/`, `pending/`, `rejected/`

GoPDF.js ships **`@gopdfjs/*` npm packages** for local, private PDF processing in browser and Node.
