---
title: Engine API
order: 1
category: api
description: 'createEngine(adapter) — the only consumer entry; plugins wired inside'
---

# @gopdfjs/engine

**`createEngine(adapter)`** returns **`Gopdf`**. That is the **only** consumer API.  
Call tools as **`engine.compressPdf()`**, **`engine.mergePdfs()`**, etc.

## Architecture

```
App
  → createEngine(adapter)     @gopdfjs/engine
       → engine.*()            Gopdf facade (what you call)
            ↓ wires @gopdfjs/plugin-* (compress, repair, struct, …)
            ↓ createGopdfRuntime(adapter)
       → GopdfAdapter           createBrowserAdapter() / createNodeAdapter()
            ↓ engine (WASM) · pdfjs · canvas · ocr?
       → @gopdfjs/wasm
```

**Apps never import `@gopdfjs/plugin-*`.** Plugins are assembled inside `createEngine`.

## Boot — canonical

```ts
import { createEngine } from "@gopdfjs/engine";
import { createBrowserAdapter } from "@gopdfjs/adapter-browser";
// Node: import { createNodeAdapter } from "@gopdfjs/adapter-node";

const engine = createEngine(await createBrowserAdapter());
await engine.compressPdf(pdfBytes, "recommended");
```

| Package | Role |
|---------|------|
| `@gopdfjs/engine` | `createEngine(adapter)` → `Gopdf` + types |
| `@gopdfjs/adapter-browser` | `createBrowserAdapter()` → host ports (WASM, pdf.js, canvas) |
| `@gopdfjs/adapter-node` | `createNodeAdapter()` → host ports (+ OCR on Node) |

## Representative methods

```ts
await engine.compressPdf(bytes, "recommended", onProgress);
await engine.repairPdf(bytes);
await engine.pdfToText(bytes, { format: "txt" });
await engine.analyzePdf(bytes);
```

Exact signatures: `@gopdfjs/engine` types · [Gopdf methods](./gopdf-methods) · [AI help](../guide/ai-help)

## Import map

| Need | Import from |
|------|-------------|
| `createEngine`, `Gopdf` types | `@gopdfjs/engine` |
| `createBrowserAdapter` | `@gopdfjs/adapter-browser` |
| `createNodeAdapter` | `@gopdfjs/adapter-node` |

Do **not** import `@gopdfjs/adapter`, `@gopdfjs/plugin-*`, `@gopdfjs/runtime`, or `@gopdfjs/wasm` from application code.
