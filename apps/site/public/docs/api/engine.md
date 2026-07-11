---
title: Engine API
order: 1
category: api
description: 'createEngine and the Gopdf consumer surface'
---

# @gopdfjs/engine

**`createEngine(adapter)`** returns **`Gopdf`** — the only API product code should call.

## Architecture

```
Consumer  →  engine.*()
                 ↓
              plugin-*  (compress, repair, extract, …)
                 ↓
              GopdfRuntime
                 ↓
              GopdfAdapter  (browser or node)
                 ↓
              @gopdfjs/wasm
```

## Boot (v1 public path)

```ts
import { createBrowserGopdf } from "@gopdfjs/adapter-browser";
// Node: import { createNodeGopdf } from "@gopdfjs/adapter-node";

const engine = await createBrowserGopdf();
```

`createEngine(adapter)` exists for monorepo internals. Custom `GopdfAdapter` is **not** a v1 public surface — do not import `@gopdfjs/adapter` from apps.

## Representative methods

Methods are assembled from `plugin-*` packages. Examples:

```ts
await engine.compressPdf(bytes, "recommended", onProgress);
await engine.repairPdf(bytes);
await engine.pdfToText(bytes, { format: "txt" });
await engine.analyzePdf(bytes);
```

Exact signatures live in `@gopdfjs/engine` types and each tool RFC.

## Import map

| Need | Import from |
|------|-------------|
| `engine.compressPdf()` … types | `@gopdfjs/engine` |
| Browser boot | `@gopdfjs/adapter-browser` |
| Node boot | `@gopdfjs/adapter-node` |

Do **not** import `@gopdfjs/adapter`, `@gopdfjs/plugin-*`, `@gopdfjs/runtime`, or `@gopdfjs/wasm` from application code.
