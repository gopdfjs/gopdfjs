#!/usr/bin/env bash
# Re-fetch shared PDF fixtures from public GitHub raw URLs.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/packages/fixtures/pdf"

mkdir -p "$OUT"

PY_PDF="https://raw.githubusercontent.com/py-pdf/sample-files/main"

curl -fsSL -o "$OUT/bmaupin-basic.pdf" \
  "https://raw.githubusercontent.com/bmaupin/pdf-samples/master/basic.pdf"
curl -fsSL -o "$OUT/bmaupin-minimal.pdf" \
  "https://raw.githubusercontent.com/bmaupin/pdf-samples/master/minimal.pdf"
curl -fsSL -o "$OUT/py-pdf-libre-writer.pdf" \
  "$PY_PDF/002-trivial-libre-office-writer/002-trivial-libre-office-writer.pdf"
curl -fsSL -o "$OUT/py-pdf-4-pages.pdf" \
  "$PY_PDF/004-pdflatex-4-pages/pdflatex-4-pages.pdf"
curl -fsSL -o "$OUT/pdfjs-annotation-link.pdf" \
  "https://raw.githubusercontent.com/mozilla/pdf.js/master/test/pdfs/annotation-link-text-popup.pdf"

echo "OK: refreshed $OUT (flate-sample.pdf is repo-owned, not downloaded)"
