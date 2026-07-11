---
title: Installation
order: 3
category: guide
description: 'Install @gopdfjs packages from npm or from this monorepo workspace'
---

# Installation

## From npm

```bash
pnpm add @gopdfjs/adapter-browser @gopdfjs/engine
# or
pnpm add @gopdfjs/adapter-node @gopdfjs/engine
```

Publish order and gates: monorepo `docs/PUBLISHING.md`.

## Monorepo contributors

Add workspace dependencies to your app package:

```json
{
  "dependencies": {
    "@gopdfjs/engine": "workspace:*",
    "@gopdfjs/adapter-browser": "workspace:*"
  }
}
```

Then build WASM once:

```bash
pnpm build:wasm
```

See `apps/demo` for a working Vite + React integration.

## CLI (separate repo)

Terminal usage does **not** require embedding `@gopdfjs/*`:

```bash
# See https://github.com/gopdfjs/gopdf-cli
gopdf compress input.pdf -o output.pdf
```

## Do not import

| Package | Who imports |
|---------|-------------|
| `@gopdfjs/plugin-*` | Engine only |
| `@gopdfjs/runtime` | Plugins only |
| `@gopdfjs/wasm` | Adapters only |

Apps call **`engine.*()`** — plugins are wired inside `createEngine`.
