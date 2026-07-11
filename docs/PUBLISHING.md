# Publishing `@gopdfjs/*`

> Stub — referenced by RFC 0058 §2.2 / §3.5. Flesh out before first npm publish.

## Packages

All publishable packages live in `packages/` and currently carry `"private": true` with `exports` pointing at `.ts` source. Before publish each package needs:

1. A build step producing `dist/` (JS + `.d.ts`) — not yet defined.
2. `exports` rewritten to `dist/` paths (no `src` deep paths — RFC 0058 §3.5).
3. `"private": true` removed (or `publishConfig` override).

| Package | Notes |
|---------|-------|
| `@gopdfjs/runtime` | Publish first — plugin runtime dep |
| `@gopdfjs/plugin` | Publish with runtime — domain types |
| `@gopdfjs/adapter` | Publish with runtime — adapter contract |
| `@gopdfjs/engine` | JS facade only — **no** wasm-pack output |
| `@gopdfjs/adapter-browser` · `@gopdfjs/adapter-node` | Depend on `@gopdfjs/wasm`; publish with adapters |
| `@gopdfjs/files` | Host file helpers (optional) |

MCP server + agent install (`gopdf mcp`, `gopdf install …`) live in **[`gopdf-cli`](https://github.com/gopdfjs/gopdf-cli)** — not an `@gopdfjs/*` npm package.
| `@gopdfjs/fixtures` | Never published (dev only) |

## Publish order

`runtime` + `plugin` + `adapter` → `@gopdfjs/wasm` → `engine` + plugins → adapters → `files` (optional).

Note: `engine` has adapters in `devDependencies` (tests) while adapters depend on `engine` at runtime — dev-only cycle, harmless for pnpm, but publish must follow the order above.

## Gate

RFC 0058 §3.5 checklist must be green (`pnpm validate`, browser e2e, no src path leaks) before any publish.

Automated guards (run in `pnpm test`):

- `pnpm check:layer-deps` — `plugin-*` prod deps must not pull `@gopdfjs/adapter*` / `engine`
- `pnpm check:public-exports` — consumer barrels must not re-export ports, WASM, or plugins

### Consumer import map

| Need | Import from |
|------|-------------|
| `engine.compressPdf()` … | `@gopdfjs/engine` |
| Browser one-liner | `@gopdfjs/adapter-browser` → `createBrowserGopdf()` |
| Custom adapter + engine | `@gopdfjs/adapter-browser` → `createBrowserAdapter()` + `@gopdfjs/engine` → `createEngine()` |
| `GopdfAdapter` type | `@gopdfjs/adapter` |

## Bundler guidance for consumers

Browser hosts bundling `@gopdfjs/adapter-browser` need WASM asset handling + top-level await support (see RFC 0057 §4.3). Document concrete Vite/webpack snippets here before publish.
