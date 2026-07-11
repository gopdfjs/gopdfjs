---
title: Browser
order: 4
category: guide
description: 'Use @gopdfjs/adapter-browser with Vite, Workers, and WASM'
---

# Browser integration

Browser apps use **`@gopdfjs/adapter-browser`**, which loads WASM in a Worker and keeps PDF bytes on the client.

## Minimal example

```ts
import { createEngine } from "@gopdfjs/engine";
import { createBrowserAdapter } from "@gopdfjs/adapter-browser";

export async function compress(pdfBytes: Uint8Array) {
  const engine = createEngine(await createBrowserAdapter());
  return engine.compressPdf(pdfBytes, "recommended", (progress) => {
    console.log("progress", progress);
  });
}
```

## Bundler requirements

- **Top-level await** support (Vite default)
- **WASM asset** handling — the adapter ships wasm-pack output; run `pnpm build:wasm` in the monorepo before dev
- **Worker** bundling — see RFC 0057 (WASM Worker architecture)

## Adapter + engine (canonical boot)

Every browser app follows this pattern — adapter supplies WASM/pdf.js/canvas ports; engine wires plugins:

```ts
import { createEngine } from "@gopdfjs/engine";
import { createBrowserAdapter } from "@gopdfjs/adapter-browser";

const engine = createEngine(await createBrowserAdapter());
await engine.analyzePdf(bytes);
```

## Local smoke app

```bash
pnpm --filter=@gopdfjs/demo-react dev
```

Open the demo to exercise engine tools in the browser.
