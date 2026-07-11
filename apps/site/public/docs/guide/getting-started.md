---
title: Getting Started
order: 1
category: guide
description: 'Install GoPDF.js packages and run your first compress in browser or Node'
---

# Getting Started

**This monorepo** ships **`@gopdfjs/*` npm packages** for local PDF work in the browser and Node. The consumer-facing API is `@gopdfjs/engine` (or adapter one-liners). **`gopdf-cli` is not in this repository.**

## Three ways to use GoPDF.js

| Path | When |
|------|------|
| **Browser app** | `import` from `@gopdfjs/adapter-browser` |
| **Node script** | `import` from `@gopdfjs/adapter-node` |
| **Terminal** | **[gopdf-cli](https://github.com/gopdfjs/gopdf-cli)** — separate repo, not in this monorepo |

## Monorepo contributors

```bash
pnpm install
pnpm build:wasm   # required before browser/node adapters work
pnpm --filter=@gopdfjs/demo-react dev
```

## Browser one-liner

```ts
import { createBrowserGopdf } from "@gopdfjs/adapter-browser";

const engine = await createBrowserGopdf();
const out = await engine.compressPdf(pdfBytes, "recommended");
```

## Node one-liner

```ts
import { createNodeGopdf } from "@gopdfjs/adapter-node";

const engine = await createNodeGopdf();
const text = await engine.pdfToText(pdfBytes, { format: "txt" });
```

## Next steps

- [Installation](./installation) — workspace vs npm (when published)
- [Browser guide](./browser) — Vite, Worker, WASM assets
- [Node guide](./node) — adapter-node setup
- [CLI](./cli) — `gopdf` commands in the separate repo
