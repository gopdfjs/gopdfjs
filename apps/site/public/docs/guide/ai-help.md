---
title: AI & agents
order: 2
category: guide
description: 'Copy-paste context for LLMs — browser and Node integration with @gopdfjs/*'
---

# AI help — using GoPDF.js (browser & Node)

**Give this page to coding agents.** This monorepo ships **`@gopdfjs/*` npm libraries only** — not a CLI.

## Golden rules

1. **Consumer API** = `engine.*()` on `Gopdf` from `createBrowserGopdf()` or `createNodeGopdf()`.
2. **Install (apps):** `@gopdfjs/engine` + `@gopdfjs/adapter-browser` **or** `@gopdfjs/adapter-node`.
3. **Never import** `@gopdfjs/plugin-*`, `@gopdfjs/runtime`, `@gopdfjs/wasm`, `@gopdfjs/adapter` from app code.
4. **Input/output** = `Uint8Array` (read `File` / `fs` once at the edge).
5. **Reuse one engine** per workflow — `await createBrowserGopdf()` is async (WASM init).

## Browser (React, Vite, etc.)

```ts
import { createBrowserGopdf } from "@gopdfjs/adapter-browser";

const engine = await createBrowserGopdf();
const pdfBytes = new Uint8Array(await file.arrayBuffer());

const compressed = await engine.compressPdf(pdfBytes, "recommended", (p) => {
  console.log("progress", p);
});

const analysis = await engine.analyzePdf(pdfBytes);
const pages = await engine.pdfToJpeg(pdfBytes, { scale: 2 });
```

**Bundler:** top-level await OK (Vite). WASM ships with adapter — see [Browser guide](./browser).

**Browser-only APIs:** `htmlToPdf`, `markdownToHtml`, `createCompareSession`, `visualDiffCanvases` (need DOM).

## Node (scripts, servers)

```ts
import { readFile, writeFile } from "node:fs/promises";
import { createNodeGopdf } from "@gopdfjs/adapter-node";

const engine = await createNodeGopdf();
const input = await readFile("input.pdf");

const output = await engine.compressPdf(input, "recommended");
await writeFile("output.pdf", output);

const text = await engine.pdfToText(input, { format: "txt" });
const ocrText = await engine.ocr(input, "eng"); // Node adapter only
```

See [Node guide](./node).

## Common mistakes (agents)

| Wrong | Right |
|-------|-------|
| `import { mergePdfs } from "@gopdfjs/plugin-struct"` | `engine.mergePdfs([a, b])` |
| `import { compressPdf } from "@gopdfjs/engine"` | `engine.compressPdf(bytes, level)` |
| Mutating the same `Uint8Array` without cloning at app boundary | OK — engine clones at facade |
| Expecting CLI in this repo | Libraries only — embed adapter in **your** app |

## Full method list

Every public `Gopdf` method with browser/Node notes: **[Gopdf API reference](../api/gopdf-methods)**.

## Monorepo contributors

```bash
pnpm install
pnpm build:wasm
pnpm --filter=@gopdfjs/demo-react dev
```

## Related

- [Getting started](./getting-started)
- [Installation](./installation)
- [Engine API](../api/engine)
