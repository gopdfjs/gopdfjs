---
"@gopdfjs/engine": minor
"@gopdfjs/adapter-browser": minor
"@gopdfjs/adapter-node": minor
---

First public npm release (0.2.0 lockstep).

- `@gopdfjs/engine` — `createEngine(adapter)`; bundles internal `@gopdfjs/*`; env-agnostic (no browser/Node imports).
- `@gopdfjs/adapter-browser` — `createBrowserGopdf()`; WASM vendored in tarball.
- `@gopdfjs/adapter-node` — `createNodeGopdf()`; WASM + OCR ports; integration bytes-chain test lives here.

All features via `engine.*()` only.
