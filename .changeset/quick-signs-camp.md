---
"@gopdfjs/engine": minor
"@gopdfjs/adapter-browser": minor
"@gopdfjs/adapter-node": minor
---

First public npm release (0.2.0 lockstep).

- `@gopdfjs/engine` — `createEngine(adapter)`; env-agnostic
- `@gopdfjs/adapter-browser` — `createBrowserGopdf()`; WASM vendored
- `@gopdfjs/adapter-node` — `createNodeGopdf()`; WASM + OCR

All features via `engine.*()` only.
