# @gopdfjs/demo-react

Browser acceptance host for Playwright e2e (`pnpm test:e2e`).

| Route | Purpose |
|-------|---------|
| `/` | Engine smoke — `createEngine` + adapter, chained `engine.*()` bytes pressure |
| `/tools/compress` | RFC 0008 compress (dedicated UI) |
| `/tools/<slug>` | One page per engine tool (**32** generic surfaces — `src/config/toolIds.ts`) |

```bash
pnpm --filter=@gopdfjs/demo-react dev
pnpm --filter=@gopdfjs/demo-react test
pnpm test:e2e
```

E2E matrix: `e2e/tools/all-tools.spec.ts` (generic tools) + `compress.spec.ts` + `engine-smoke.spec.ts`.

Consumer code uses only `engine.*()` — no direct `@gopdfjs/plugin-struct` / plugin imports.
