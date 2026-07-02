# GoPDF.js — WASM PDF library

**`@gopdfjs/pdf-wasm`** is a browser-first PDF toolkit built from **Rust**, compiled to **WebAssembly**, and invoked from a **dedicated Web Worker**. PDF bytes stay on the client: work is offloaded from the main thread without uploading files to a server.

## What you get

- **Rust core** (`packages/pdf-wasm/`, crate `pdf-wasm`) — `wasm-bindgen` + size-tuned release profile (see `Cargo.toml`).
- **Worker boundary** — WASM runs in a Worker; `ArrayBuffer`s are **transferred** (not copied) when calling into the worker.
- **TypeScript API** — ergonomic async functions that return `Promise<Uint8Array>` for binary results.

### Public API (high level)

| Export | Role |
|--------|------|
| `compressPdf(bytes, level, onProgress?)` | Re-compress Flate streams (`"low"` \| `"recommended"` \| `"extreme"`) |
| `encodeImages(...)` | Encode RGBA frames to JPEG/PNG (see JSDoc in `packages/pdf-wasm/index.ts`) |
| `splitEncodedImages` | Helpers for length-prefixed image blobs from `encodeImages` |
| `grayscalePdf(bytes)` | Convert embedded color images to DeviceGray |
| `linearizePdf(bytes)` | Linearize for Fast Web View |

Design notes and roadmap: `.spec/rfc/0058-wasm-pdf-library-charter.md`, worker layout: `.spec/rfc/0057-rust-wasm-worker-architecture.md`.

## Install & use (app code)

In this monorepo, depend on **`@gopdfjs/pdf-wasm`** via `workspace:*` (see `demos/react`). The package is currently **private** here; wiring for publishing to a registry is separate from the library code itself.

In a Vite/React app (or any bundler that supports `new URL(..., import.meta.url)` for Workers):

```ts
import { compressPdf } from "@gopdfjs/pdf-wasm";

const out = await compressPdf(inputBytes, "recommended", (p) => {
  console.log("progress", p);
});
```

Ensure the Worker and WASM assets resolve correctly in your bundler (Vite projects usually need no extra config beyond normal ESM).

## Build the WASM binary (contributors)

Prerequisites: **Rust**, target **`wasm32-unknown-unknown`**, and **`wasm-pack`**.

From the repository root:

```bash
pnpm install
pnpm build:wasm
```

Dev build (faster iteration, larger artifact):

```bash
pnpm build:wasm:dev
```

Artifacts land under `packages/pdf-wasm/pkg/`. Without a successful `build:wasm`, imports that load the Worker/WASM will fail at runtime.

## Monorepo layout (this repository)

| Path | Purpose |
|------|---------|
| **`crates/gopdf-*`** | Rust PDF algorithms (host-testable `rlib`) |
| **`crates/pdf-wasm`** | Thin `wasm-bindgen` `cdylib` |
| **`packages/pdf-wasm`** | Thin JS Worker proxy (`@gopdfjs/pdf-wasm`) |
| **`packages/tools`** | L2 tool orchestration (`@gopdfjs/tools`) |
| **`site`** | Vite + React SPA (`@gopdfjs/site`) |
| **`demos/react`** | WASM tool demo (e.g. Compress) — see `demos/react/README.md` |
| **`packages/i18n`**, **`packages/ui`**, **`packages/locale-cli`** | Shared i18n, UI, locale CLI |

Root scripts:

```bash
pnpm dev          # dev via monorepo orchestration
pnpm build        # turbo build
pnpm build:wasm   # wasm-pack → packages/pdf-wasm/pkg (crates/pdf-wasm)
pnpm test:rust    # cargo test --workspace
pnpm test         # test:rust + turbo vitest
pnpm test:e2e     # Playwright (.spec/e2e)
pnpm validate     # test + lint + build
```

## Documentation

- **Roadmap**: [.spec/ROADMAP.md](./.spec/ROADMAP.md) — phases and RFC registry
- **Tasks**: [.spec/TASK_TRACKING.md](./.spec/TASK_TRACKING.md) — current work items
- **RFC specs**: `.spec/rfc/` — flat active RFCs; archives: `completed/`, `pending/`, `rejected/`; template: `.spec/rfc/_template.md`
- **Site-specific** notes: `site/README.md`.

---

GoPDF.js is built for **local, private PDF processing** in the browser; the WASM library is the place where Rust-backed operations live.
