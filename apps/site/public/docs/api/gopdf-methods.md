---
title: Gopdf methods
order: 2
category: api
description: 'Complete engine.*() reference — browser and Node availability'
---

# `Gopdf` method reference

All methods live on **`Gopdf`** — returned by **`createEngine(adapter)`**.  
Types: `@gopdfjs/engine`. Authority: `packages/adapter/src/gopdf.ts` + `createEngine.ts`.

## Boot

```ts
import { createEngine } from "@gopdfjs/engine";
import { createBrowserAdapter } from "@gopdfjs/adapter-browser";
// Node: import { createNodeAdapter } from "@gopdfjs/adapter-node";

const engine = createEngine(await createBrowserAdapter());
```

## WASM / optimize

| Method | Returns | Browser | Node | Summary |
|--------|---------|---------|------|---------|
| `compressPdf(bytes, level, onProgress?)` | `Uint8Array` | ✓ | ✓ | Shrink PDF. `level`: `"low"` \| `"recommended"` \| `"extreme"`. |
| `grayscalePdf(bytes, options, onProgress?)` | `GrayscalePdfResult` | ✓ | ✓ | Raster grayscale pass. |
| `linearizePdf(bytes)` | `Uint8Array` | ✓ | ✓ | Web-optimize / linearize (WASM). |

## Render & text

| Method | Returns | Browser | Node | Summary |
|--------|---------|---------|------|---------|
| `pdfToJpeg(bytes, options?)` | `PdfJpegPage[]` | ✓ | ✓ | Render pages to JPEG bytes. `scale`, `quality`. |
| `pdfToText(bytes, options?, onProgress?)` | `string` | ✓ | ✓ | Text export. `format`: `"txt"` \| `"html"` \| `"rtf"`. |
| `ocr(bytes, lang?, onProgress?)` | `string` | — | ✓ | OCR via Node adapter (tesseract). |

## Structure & pages (pdf-lib)

| Method | Returns | Browser | Node | Summary |
|--------|---------|---------|------|---------|
| `mergePdfs(inputs)` | `Uint8Array` | ✓ | ✓ | Combine PDFs in order. |
| `splitPdf(bytes, ranges)` | `Uint8Array[]` | ✓ | ✓ | Split by page ranges. |
| `rotatePdf(bytes, deg, pages)` | `Uint8Array` | ✓ | ✓ | `deg`: 90 \| 180 \| 270. |
| `organizePdf(bytes, order)` | `Uint8Array` | ✓ | ✓ | Reorder pages by index list. |
| `cropPdf(bytes, margins)` | `Uint8Array` | ✓ | ✓ | Trim margins (pt). |
| `protectPdf(bytes, password)` | `Uint8Array` | ✓ | ✓ | Encrypt with password. |
| `unlockPdf(bytes, password)` | `Uint8Array` | ✓ | ✓ | Decrypt with password. |
| `watermarkPdf(bytes, content, opts)` | `Uint8Array` | ✓ | ✓ | Text or image watermark. |
| `signPdf(bytes, pngBytes, placement)` | `Uint8Array` | ✓ | ✓ | Image signature overlay. |
| `halvePdf(bytes, opts)` | `Uint8Array` | ✓ | ✓ | Split page in half. |
| `nUpPdf(bytes, opts)` | `Uint8Array` | ✓ | ✓ | N-up imposition layouts. |
| `addPageNumbers(bytes, opts)` | `Uint8Array` | ✓ | ✓ | Page number stamp. |
| `addHeaderFooter(bytes, opts)` | `Uint8Array` | ✓ | ✓ | Header/footer text. |
| `fillPdfForm(bytes, values, options?, fields?)` | `Uint8Array` | ✓ | ✓ | AcroForm fill; optional flatten. |
| `applyNativeTextEdits(bytes, edits)` | `Uint8Array` | ✓ | ✓ | Overlay text boxes on pages. |
| `jpgToPdf(images)` | `Uint8Array` | ✓ | ✓ | Images → single PDF. |

## Repair & redact

| Method | Returns | Browser | Node | Summary |
|--------|---------|---------|------|---------|
| `repairPdf(bytes, options?, onProgress?)` | `RepairPdfResult` | ✓ | ✓ | Fix common PDF issues. |
| `repairPdfBatch(inputs, …)` | `BatchRepairResult` | ✓ | ✓ | Batch repair multiple files. |
| `redactPdf(bytes, regions, options?, onProgress?)` | `Uint8Array` | ✓ | ✓ | Permanent redaction regions. |

## Extract & convert

| Method | Returns | Browser | Node | Summary |
|--------|---------|---------|------|---------|
| `extractImages(bytes)` | `{ blob, name, page }[]` | ✓ | ✓ | Embedded images per page. |
| `extractPdfTextRuns(bytes, onProgress?)` | `PdfTextRun[]` | ✓ | ✓ | Positioned text runs. |
| `pdfToWord(bytes, onProgress?)` | `Blob` | ✓ | ✓ | DOCX export. |
| `pdfToExcel(bytes, exportOptions, …)` | `{ blob, analysis }` | ✓ | ✓ | XLSX/CSV export. |
| `pdfToPpt(bytes, options, …)` | `Blob` | ✓ | ✓ | PPTX export. |
| `pdfToEpub(bytes, options, …)` | `Blob` | ✓ | ✓ | EPUB export. |

## Inspect & annotate

| Method | Returns | Browser | Node | Summary |
|--------|---------|---------|------|---------|
| `analyzePdf(bytes, meta?)` | `PdfAnalysisResult` | ✓ | ✓ | Metadata, pages, fonts, etc. |
| `applyEdits(bytes, annotations)` | `Uint8Array` | ✓ | ✓ | Annotation layer (highlights, etc.). |

## Compare (browser-heavy)

| Method | Returns | Browser | Node | Summary |
|--------|---------|---------|------|---------|
| `comparePdfText(bytesA, bytesB, options?)` | `TextDiffResult` | ✓ | ✓ | Text-level diff. |
| `createCompareSession(bytesA, bytesB)` | `CompareSession` | ✓ | — | Dual-pane viewer session (DOM). |
| `visualDiffCanvases(canvasA, canvasB)` | `VisualDiffResult` | ✓ | — | Pixel diff between canvases. |

## Author (browser only)

| Method | Returns | Browser | Node | Summary |
|--------|---------|---------|------|---------|
| `htmlToPdf(html, options?, onProgress?)` | `HtmlToPdfResult` | ✓ | — | HTML string → PDF (DOM). |
| `markdownToHtml(source)` | `string` | ✓ | — | Markdown → HTML for `htmlToPdf`. |

## Not on `Gopdf` (internal)

- `loadDocument` — plugins/runtime only
- `encodeImages` — WASM primitive on adapter engine port
- `adapter` — never exposed on consumer facade
