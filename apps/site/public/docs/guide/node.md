---
title: Node
order: 5
category: guide
description: 'Use @gopdfjs/adapter-node in scripts and servers'
---

# Node integration

Node scripts use **`@gopdfjs/adapter-node`** with the same **`Gopdf`** API as the browser.

## Minimal example

```ts
import { readFile, writeFile } from "node:fs/promises";
import { createEngine } from "@gopdfjs/engine";
import { createNodeAdapter } from "@gopdfjs/adapter-node";

const input = await readFile("input.pdf");
const engine = createEngine(await createNodeAdapter());
const output = await engine.compressPdf(input, "recommended");
await writeFile("output.pdf", output);
```

## WASM on Node

Adapters initialize `@gopdfjs/wasm` from the built `pkg/` directory. Contributors run:

```bash
pnpm build:wasm
```

## Related

- [Installation](./installation)
- [Gopdf methods](../api/gopdf-methods)
