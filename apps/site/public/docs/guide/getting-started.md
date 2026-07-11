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
| **AI / coding agent** | [AI help](./ai-help) — copy-paste integration context |

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

- [AI & agents](./ai-help) — LLM integration cheat sheet
- [Installation](./installation) — workspace vs npm
- [Browser guide](./browser) — Vite, Worker, WASM assets
- [Node guide](./node) — adapter-node setup
- [Gopdf methods](../api/gopdf-methods) — full `engine.*()` reference
