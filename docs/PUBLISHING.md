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
| `@gopdfjs/engine` | Ships `pkg/` WASM artifacts (`pnpm build:wasm` before publish); `./pkg/*` export is adapter-only (RFC 0057 §4.4) |
| plugin packages (`struct`, `shrink`, `grayscale`, `extract`, `repair`, `redact`, `annotate`, `author`, `inspect`, `render`, `compare`) | Implementation units; not consumer facade |
| `@gopdfjs/adapter-browser` · `@gopdfjs/adapter-node` | Publish last — depend on `engine` at runtime |
| `@gopdfjs/files` · `@gopdfjs/setup` | Host helpers / MCP installer |
| `@gopdfjs/fixtures` | Never published (dev only) |

## Publish order

`runtime` + `plugin` + `adapter` → `engine` + plugins → adapters → `files`/`setup`.

Note: `engine` has adapters in `devDependencies` (tests) while adapters depend on `engine` at runtime — dev-only cycle, harmless for pnpm, but publish must follow the order above.

## Gate

RFC 0058 §3.5 checklist must be green (`pnpm validate`, browser e2e, no src path leaks) before any publish.

## Bundler guidance for consumers

Browser hosts bundling `@gopdfjs/adapter-browser` need WASM asset handling + top-level await support (see RFC 0057 §4.3). Document concrete Vite/webpack snippets here before publish.
