# @gopdfjs/engine

## 0.2.0

### Minor Changes

- 21fa76a: First public npm release at 0.2.0 (lockstep).

  - `@gopdfjs/engine` — env-agnostic `createEngine(adapter)`; bundles internal `@gopdfjs/*`
  - `@gopdfjs/adapter-browser` — `createBrowserGopdf()`; WASM in tarball
  - `@gopdfjs/adapter-node` — `createNodeGopdf()`; WASM + OCR

  All features via `engine.*()` only.

## 0.2.0

### Minor Changes

- 06eeaa3: First public npm release (0.2.0 lockstep).

  - `@gopdfjs/engine` — `createEngine(adapter)`; env-agnostic
  - `@gopdfjs/adapter-browser` — `createBrowserGopdf()`; WASM vendored
  - `@gopdfjs/adapter-node` — `createNodeGopdf()`; WASM + OCR

  All features via `engine.*()` only.

## 0.2.0

### Minor Changes

- c330860: First public npm release (0.2.0 lockstep).

  - `@gopdfjs/engine` — `createEngine(adapter)`; bundles internal `@gopdfjs/*`; env-agnostic (no browser/Node imports).
  - `@gopdfjs/adapter-browser` — `createBrowserGopdf()`; WASM vendored in tarball.
  - `@gopdfjs/adapter-node` — `createNodeGopdf()`; WASM + OCR ports; integration bytes-chain test lives here.

  All features via `engine.*()` only.
