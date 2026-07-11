---
"@gopdfjs/engine": minor
"@gopdfjs/adapter-browser": minor
"@gopdfjs/adapter-node": minor
---

Initial public release of the three consumer packages.

- `@gopdfjs/engine` — `createEngine(adapter)` consumer facade; bundles internal `@gopdfjs/plugin-*`, runtime, adapter, and model types into `dist/` (no private `@gopdfjs/*` in the published JS or `.d.ts`).
- `@gopdfjs/adapter-browser` — `createBrowserGopdf()` / `createBrowserAdapter()`; vendors WASM into the tarball.
- `@gopdfjs/adapter-node` — `createNodeGopdf()` / `createNodeAdapter()`; vendors WASM into the tarball.

All product features are reached through `engine.*()`; plugins stay engine-internal.
