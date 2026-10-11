---
title: AI & agents
order: 2
category: guide
description: 'Copy-paste context for LLMs — createEngine, adapter, plugin layering'
---

# AI help — using GoPDF.js (browser & Node)

**Give this page to coding agents.** This monorepo ships **`@gopdfjs/*` npm libraries only** — not a CLI.

## Layer stack (read this first)

```
createEngine(adapter)  →  Gopdf  →  engine.*()     ← YOU CALL THIS
       ↓ wires plugin-* internally (never import plugins from apps)
createBrowserAdapter() / createNodeAdapter()  →  GopdfAdapter  ← host ports
       ↓ WASM · pdf.js · canvas · ocr
@gopdfjs/wasm
```

## Golden rules

1. **Consumer entry** = `createEngine(adapter)` from `@gopdfjs/engine`.
2. **Adapter** = `createBrowserAdapter()` or `createNodeAdapter()` from adapter package.
3. **Tools** = `engine.compressPdf()`, `engine.mergePdfs()`, … — **not** direct plugin imports.
4. **Never import** `@gopdfjs/plugin-*`, `@gopdfjs/runtime`, `@gopdfjs/wasm` from app code.
5. **Input/output** = `Uint8Array` (read `File` / `fs` at the edge).
6. **Reuse one engine** per workflow — adapter init is async (WASM).

## Browser (React, Vite, Next.js client, etc.)

**Next.js:** `"use client"` components and client libs → **`createBrowserAdapter()` only**. Do not use `createNodeAdapter()` in client bundles.

```ts
import { createEngine } from "@gopdfjs/engine";
import { createBrowserAdapter } from "@gopdfjs/adapter-browser";

const engine = createEngine(await createBrowserAdapter());
const pdfBytes = new Uint8Array(await file.arrayBuffer());

const compressed = await engine.compressPdf(pdfBytes, "recommended", (p) => {
  console.log("progress", p);
});

const ocrText = await engine.ocr(pdfBytes, "eng");
```

**Browser-only APIs:** `htmlToPdf`, `markdownToHtml`, `createCompareSession`, `visualDiffCanvases` (need DOM).

## Node (scripts, servers)

```ts
import { readFile, writeFile } from "node:fs/promises";
import { createEngine } from "@gopdfjs/engine";
import { createNodeAdapter } from "@gopdfjs/adapter-node";

const engine = createEngine(await createNodeAdapter());
const input = await readFile("input.pdf");

const output = await engine.compressPdf(input, "recommended");
await writeFile("output.pdf", output);

const ocrText = await engine.ocr(input, "eng");
```

## Common mistakes (agents)

| Wrong | Right |
|-------|-------|
| `import { mergePdfs } from "@gopdfjs/plugin-struct"` | `engine.mergePdfs([a, b])` via `createEngine(adapter)` |
| `export * from "@gopdfjs/plugin-extract/ocr"` | `engine.ocr(bytes, "eng")` — subpath does not exist |
| Next.js client uses `createNodeAdapter()` | Next.js client uses `createBrowserAdapter()` |
| `import { compressPdf } from "@gopdfjs/engine"` | `engine.compressPdf(bytes, level)` on `Gopdf` instance |
| Skip adapter, call WASM directly | `createEngine(await createXxxAdapter())` |
| Expecting CLI in this repo | Libraries only — embed engine in **your** app |

## Full method list

[Gopdf API reference](../api/gopdf-methods) · [Engine API](../api/engine)

## Monorepo contributors

```bash
pnpm install
pnpm build:wasm
pnpm --filter=@gopdfjs/demo-react dev
```

## Related

- [Getting started](./getting-started)
- [Browser guide](./browser)
- [Node guide](./node)
