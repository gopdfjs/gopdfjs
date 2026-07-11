# @gopdfjs/adapter-browser

## 0.2.0

### Minor Changes

- c330860: First public npm release (0.2.0 lockstep).

  - `@gopdfjs/engine` — `createEngine(adapter)`; bundles internal `@gopdfjs/*`; env-agnostic (no browser/Node imports).
  - `@gopdfjs/adapter-browser` — `createBrowserGopdf()`; WASM vendored in tarball.
  - `@gopdfjs/adapter-node` — `createNodeGopdf()`; WASM + OCR ports; integration bytes-chain test lives here.

  All features via `engine.*()` only.

### Patch Changes

- Updated dependencies [c330860]
  - @gopdfjs/engine@0.2.0
