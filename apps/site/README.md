# @gopdfjs/site

GoPDF.js docs landing — static site for **GitHub Pages** (`/gopdfjs/` base).

Built with [WSX](https://www.wsxjs.dev) (`@wsxjs/wsx-*`) + [wsx-press](https://www.wsxjs.dev) for markdown docs.

## Commands

```bash
pnpm --filter=@gopdfjs/site dev
pnpm --filter=@gopdfjs/site build    # dist/ with base /gopdfjs/
pnpm --filter=@gopdfjs/site preview  # preview production build
```

## Content

| Path | Purpose |
|------|---------|
| `src/` | WSX pages (home, packages, shell) |
| `public/docs/` | Markdown consumed by wsx-press |
| `public/locales/` | i18next JSON (en, zh) |

## Deploy

Push to `main` with changes under `apps/site/**` triggers `.github/workflows/deploy-site.yml`.

Not the product UI — browser tool smoke lives in `apps/demo`.
