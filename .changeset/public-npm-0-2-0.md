---
"@gopdfjs/engine": minor
"@gopdfjs/adapter-browser": minor
"@gopdfjs/adapter-node": minor
---

First public npm release at 0.2.0 (lockstep).

- `@gopdfjs/engine` — env-agnostic `createEngine(adapter)`; bundles internal `@gopdfjs/*`
- `@gopdfjs/adapter-browser` — `createBrowserGopdf()`; WASM in tarball
- `@gopdfjs/adapter-node` — `createNodeGopdf()`; WASM + OCR

All features via `engine.*()` only.
