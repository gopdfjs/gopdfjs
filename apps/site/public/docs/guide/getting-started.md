---
title: Getting Started
order: 1
category: guide
description: 'createEngine(adapter) — boot GoPDF.js in browser or Node'
---

# Getting Started

**This monorepo** ships **`@gopdfjs/*` npm packages**. Consumer API:

```ts
createEngine(adapter) → Gopdf → engine.*()
```

**`gopdf-cli` is not in this repository.**

## Architecture (3 packages)

| Layer | Package | Export |
|-------|---------|--------|
| **Engine** | `@gopdfjs/engine` | `createEngine(adapter)` → `Gopdf` |
| **Adapter** | `@gopdfjs/adapter-browser` or `adapter-node` | `createBrowserAdapter()` / `createNodeAdapter()` |
| **Plugins** | `@gopdfjs/plugin-*` | **internal** — wired inside `createEngine` |

## Browser

```ts
import { createEngine } from "@gopdfjs/engine";
import { createBrowserAdapter } from "@gopdfjs/adapter-browser";

const engine = createEngine(await createBrowserAdapter());
const out = await engine.compressPdf(pdfBytes, "recommended");
```

## Node

```ts
import { createEngine } from "@gopdfjs/engine";
import { createNodeAdapter } from "@gopdfjs/adapter-node";

const engine = createEngine(await createNodeAdapter());
const text = await engine.pdfToText(pdfBytes, { format: "txt" });
```

## Monorepo contributors

```bash
pnpm install
pnpm build:wasm   # required before adapters work
pnpm --filter=@gopdfjs/demo-react dev
```

## Next steps

- [AI & agents](./ai-help) — LLM cheat sheet
- [Engine API](../api/engine) — architecture + import map
- [Gopdf methods](../api/gopdf-methods) — full `engine.*()` table
- [Browser guide](./browser) · [Node guide](./node)
