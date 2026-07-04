# @gopdfjs/pdf-cli

Local PDF CLI (`gopdf`). Reads/writes files on disk only — no upload.

## Install

```bash
pnpm add -g @gopdfjs/pdf-cli
# or
npx @gopdfjs/pdf-cli compress ./sample.pdf
```

Bin: **`gopdf`** (alias **`gopdf-cli`**).

## Usage

```bash
gopdf compress path/to/file.pdf
gopdf compress input.pdf -o output.pdf --level extreme
gopdf analyze path/to/file.pdf
```

Requires `@gopdfjs/engine-node` WASM for `compress` — run `pnpm build:wasm` in monorepo first.

## Monorepo

```bash
pnpm build:wasm
pnpm --filter=@gopdfjs/pdf-cli build
pnpm --filter=@gopdfjs/pdf-cli test
node packages/pdf-cli/dist/index.mjs compress node_modules/@gopdfjs/fixtures/pdf/py-pdf-libre-writer.pdf
```

Shared test PDFs: [`@gopdfjs/fixtures`](../fixtures/README.md).
