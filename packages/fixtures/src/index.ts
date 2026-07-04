/**
 * Shared PDF fixtures — import via `@gopdfjs/fixtures`, not repo-relative paths.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

const PACKAGE_ROOT = path.dirname(fileURLToPath(import.meta.url));

/** Absolute directory containing committed `.pdf` files. */
export const PDF_FIXTURES_DIR = path.join(PACKAGE_ROOT, "../pdf");

export const PDF_FIXTURES = {
  /** Repo-owned minimal Flate stream (RFC 0008 WASM compress e2e only; not pdf-lib). */
  FLATE_SAMPLE: path.join(PDF_FIXTURES_DIR, "flate-sample.pdf"),
  BMAUPIN_MINIMAL: path.join(PDF_FIXTURES_DIR, "bmaupin-minimal.pdf"),
  BMAUPIN_BASIC: path.join(PDF_FIXTURES_DIR, "bmaupin-basic.pdf"),
  PY_PDF_LIBRE_WRITER: path.join(PDF_FIXTURES_DIR, "py-pdf-libre-writer.pdf"),
  PY_PDF_4_PAGES: path.join(PDF_FIXTURES_DIR, "py-pdf-4-pages.pdf"),
  PDFJS_ANNOTATION_LINK: path.join(PDF_FIXTURES_DIR, "pdfjs-annotation-link.pdf"),
} as const;

export type PdfFixtureId = keyof typeof PDF_FIXTURES;

export type FixtureCase = {
  id: string;
  file: string;
};

/** Default matrix for compress browser e2e — small → realistic. */
export const COMPRESS_E2E_MATRIX: readonly FixtureCase[] = [
  { id: "flate-sample", file: PDF_FIXTURES.FLATE_SAMPLE },
  { id: "bmaupin-basic", file: PDF_FIXTURES.BMAUPIN_BASIC },
  { id: "py-pdf-libre-writer", file: PDF_FIXTURES.PY_PDF_LIBRE_WRITER },
];

/** Subset for CLI smoke tests (pdf-lib must parse the file). */
export const CLI_SMOKE_FIXTURES: readonly FixtureCase[] = [
  { id: "bmaupin-basic", file: PDF_FIXTURES.BMAUPIN_BASIC },
  { id: "py-pdf-libre-writer", file: PDF_FIXTURES.PY_PDF_LIBRE_WRITER },
  { id: "py-pdf-4-pages", file: PDF_FIXTURES.PY_PDF_4_PAGES },
];
