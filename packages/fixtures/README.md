# Shared PDF fixtures (`@gopdfjs/fixtures`)

Committed samples for **CLI tests**, **Playwright e2e**, and local demos.

```ts
import { PDF_FIXTURES, COMPRESS_E2E_MATRIX } from "@gopdfjs/fixtures";
```

Re-download from upstream:

```bash
pnpm fixtures:download
```

## Files

| File | Size | Use | Upstream | License |
|------|------|-----|----------|---------|
| `flate-sample.pdf` | 90 B | RFC 0008 WASM compress e2e only (not pdf-lib) | generated in-repo | MIT (repo) |
| `bmaupin-minimal.pdf` | 437 B | tiny valid PDF | [bmaupin/pdf-samples](https://github.com/bmaupin/pdf-samples/blob/master/minimal.pdf) | Unlicense |
| `bmaupin-basic.pdf` | 810 B | minimal + font/text | [bmaupin/pdf-samples](https://github.com/bmaupin/pdf-samples/blob/master/basic.pdf) | Unlicense |
| `py-pdf-libre-writer.pdf` | 12 KB | born-digital text, FlateDecode | [py-pdf/sample-files](https://github.com/py-pdf/sample-files/blob/main/002-trivial-libre-office-writer/002-trivial-libre-office-writer.pdf) | CC-BY-SA-4.0 |
| `py-pdf-4-pages.pdf` | 24 KB | multi-page, FlateDecode | [py-pdf/sample-files](https://github.com/py-pdf/sample-files/blob/main/004-pdflatex-4-pages/pdflatex-4-pages.pdf) | CC-BY-SA-4.0 |
| `pdfjs-annotation-link.pdf` | 97 KB | pdf.js test corpus, annotations | [mozilla/pdf.js](https://github.com/mozilla/pdf.js/blob/master/test/pdfs/annotation-link-text-popup.pdf) | Apache-2.0 |

## Raw URLs (pin by commit when refreshing)

```
https://raw.githubusercontent.com/bmaupin/pdf-samples/master/minimal.pdf
https://raw.githubusercontent.com/bmaupin/pdf-samples/master/basic.pdf
https://raw.githubusercontent.com/py-pdf/sample-files/main/002-trivial-libre-office-writer/002-trivial-libre-office-writer.pdf
https://raw.githubusercontent.com/py-pdf/sample-files/main/004-pdflatex-4-pages/pdflatex-4-pages.pdf
https://raw.githubusercontent.com/mozilla/pdf.js/master/test/pdfs/annotation-link-text-popup.pdf
```

More catalogs: [jonasclaes/test-data](https://github.com/jonasclaes/test-data), [py-pdf/sample-files/files.json](https://github.com/py-pdf/sample-files/blob/main/files.json).
