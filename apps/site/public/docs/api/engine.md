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

## createEngine

```ts
import { createEngine } from "@gopdfjs/engine";
import type { GopdfAdapter } from "@gopdfjs/adapter";

export function boot(adapter: GopdfAdapter) {
  return createEngine(adapter);
}
```

Most apps use the adapter helpers instead:

```ts
import { createBrowserGopdf } from "@gopdfjs/adapter-browser";
const engine = await createBrowserGopdf();
```

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
| `engine.compressPdf()` … | `@gopdfjs/engine` |
| Browser one-liner | `@gopdfjs/adapter-browser` |
| Node one-liner | `@gopdfjs/adapter-node` |
| `GopdfAdapter` type | `@gopdfjs/adapter` |

Do **not** import `@gopdfjs/plugin-*`, `@gopdfjs/runtime`, or `@gopdfjs/wasm` from application code.
