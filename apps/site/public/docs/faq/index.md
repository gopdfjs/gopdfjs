---
title: FAQ
order: 1
category: faq
description: 'Common questions about GoPDF.js packages, WASM, and CLI'
---

# FAQ

## Where is the CLI?

In **[gopdf-cli](https://github.com/gopdfjs/gopdf-cli)** — not in this monorepo.

## Why do I need `pnpm build:wasm`?

Browser and Node adapters load the wasm-pack output from `@gopdfjs/wasm`. Without a successful build, WASM init fails at runtime.

## Can I import `@gopdfjs/plugin-shrink` directly?

No. Plugins are engine-internal. Use `engine.compressPdf()` (and siblings) from `@gopdfjs/engine`.

## Browser vs Node?

Same **`Gopdf`** API; different adapters (`adapter-browser` vs `adapter-node`).

## Where are RFCs and the roadmap?

In this repo: `.spec/ROADMAP.md`, `.spec/TASK_TRACKING.md`, and `.spec/rfc/`.

## Where is the browser demo?

`apps/demo` — run `pnpm --filter=@gopdfjs/demo-react dev`.
