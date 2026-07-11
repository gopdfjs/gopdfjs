# @gopdfjs/engine

## 0.2.0

### Minor Changes

- 6672d16: Initial public npm release of the three consumer packages.

  - `@gopdfjs/engine` — `createEngine(adapter)` facade; bundles internal `@gopdfjs/plugin-*`, runtime, adapter, and model into `dist/` (no private `@gopdfjs/*` in published JS or `.d.ts`).
  - `@gopdfjs/adapter-browser` — `createBrowserGopdf()`; vendors WASM in tarball.
  - `@gopdfjs/adapter-node` — `createNodeGopdf()`; vendors WASM in tarball.

  All features via `engine.*()` only.
