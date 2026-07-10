---
name: gopdf-e2e
description: >-
  Browser E2E verification for GoPDF npm packages via Playwright on demos/react.
  Use when adding RFC tool acceptance tests, running pnpm test:e2e, or checking
  compress/WASM flows in a real browser.
---

# GoPDF browser E2E (Playwright)

RFC browser acceptance tests live under **`demos/react/e2e/`** — not `.spec/`.

## Layout

```
demos/react/e2e/
  playwright.config.ts   # starts demo Vite on :4174
  tools/<slug>.spec.ts   # one file per tool RFC (copy compress)

Fixtures: `@gopdfjs/fixtures` (`packages/fixtures/`).
```

Host app: **`@gopdfjs/demo-react`** (`/tools/compress`, …).

## Run

From repo root (builds WASM if missing via `pretest:e2e`):

```bash
pnpm build:wasm    # first time / after Rust changes
pnpm test:e2e
```

Config: `demos/react/e2e/playwright.config.ts`

## Add a tool test

1. Read tool RFC (`.spec/rfc/…`).
2. Ensure demo route exists in `demos/react/src/`.
3. Add fixture under `packages/fixtures/pdf/` if needed (`pnpm fixtures:download` refreshes web samples). Import via `@gopdfjs/fixtures`.
4. Copy `demos/react/e2e/tools/compress.spec.ts` → `tools/<slug>.spec.ts`.
5. Update RFC § Tests row: `demos/react/e2e/tools/<slug>.spec.ts`.
6. Run `pnpm test:e2e`.

## CLI tools

Node-only tools → test in sibling **`gopdf-cli`** (`packages/cli` Vitest or `gopdf`), not Playwright.

## Related

- Skill: `gopdf-browser-pdf-wasm` — WASM / Worker work before e2e
- RFC 0008 — compress reference implementation
- `.spec/ROADMAP.md` — verification column
