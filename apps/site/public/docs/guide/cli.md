---
title: CLI
order: 5
category: guide
description: 'gopdf-cli — terminal commands without a browser'
---

# gopdf-cli

The **`gopdf`** binary lives in a **separate repository**: [gopdfjs/gopdf-cli](https://github.com/gopdfjs/gopdf-cli).

It shares the same Rust algorithms as this monorepo but is **zero-coupled** — no `@gopdfjs/*` import from the CLI repo into this OSS tree.

## Typical commands

```bash
gopdf compress input.pdf -o out.pdf
gopdf repair broken.pdf -o fixed.pdf
gopdf mcp          # MCP server for agents
gopdf install cursor
```

## npm packages vs CLI

| Deliverable | Location | Use case |
|-------------|----------|----------|
| `@gopdfjs/*` | This monorepo | Embed in apps |
| `gopdf-cli` | Separate repo | Terminal / CI / MCP |

Each tool RFC targets **both** a public npm API and a matching CLI subcommand (RFC 0058 §2.2).
