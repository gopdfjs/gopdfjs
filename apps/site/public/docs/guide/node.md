---
title: Node
order: 4
category: guide
description: 'Use @gopdfjs/adapter-node in scripts and servers'
---

# Node integration

Node scripts use **`@gopdfjs/adapter-node`** with the same **`Gopdf`** API as the browser.

## Minimal example

```ts
import { readFile, writeFile } from "node:fs/promises";
import { createNodeGopdf } from "@gopdfjs/adapter-node";

const input = await readFile("input.pdf");
const engine = await createNodeGopdf();
const output = await engine.compressPdf(input, "recommended");
await writeFile("output.pdf", output);
```

## WASM on Node

Adapters initialize `@gopdfjs/wasm` from the built `pkg/` directory. Contributors run:

```bash
pnpm build:wasm
```

## When to prefer CLI

If you only need terminal workflows (batch compress, repair, MCP), use **[gopdf-cli](https://github.com/gopdfjs/gopdf-cli)** instead of embedding the library.
