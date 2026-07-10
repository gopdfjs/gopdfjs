import type { CompressionLevel, Gopdf, GopdfAdapter } from "@gopdfjs/adapter/gopdf";
import { applyEdits } from "@gopdfjs/plugin-annotate";
import { htmlToPdf, markdownToHtml } from "@gopdfjs/plugin-author";
import {
  extractImages,
  extractPdfTextRuns,
  pdfToEpub,
  pdfToExcel,
  pdfToPpt,
  pdfToWord,
} from "@gopdfjs/plugin-extract";
import { grayscalePdf } from "@gopdfjs/plugin-grayscale";
import { analyzePdf } from "@gopdfjs/plugin-inspect";
import { redactPdf } from "@gopdfjs/plugin-redact";
import { repairPdf, repairPdfBatch } from "@gopdfjs/plugin-repair";
import { compressPdf as shrinkCompress, type CompressLevel } from "@gopdfjs/plugin-shrink";
import {
  addHeaderFooter,
  addPageNumbers,
  applyNativeTextEdits,
  cropPdf,
  fillPdfForm,
  halvePdf,
  jpgToPdf,
  mergePdfs,
  nUpPdf,
  organizePdf,
  protectPdf,
  rotatePdf,
  signPdf,
  splitPdf,
  unlockPdf,
  watermarkPdf,
} from "@gopdfjs/plugin-struct";
import { createGopdfRuntime } from "./createGopdfRuntime";
import { ocrPdf } from "./ocr";
import { ownPdfBytes, ownPdfBytesList } from "./ownedBytes";
import { pdfToJpeg } from "./pdfToJpeg";
import { pdfToText } from "./pdfToText";

function mapCompressionLevel(level: CompressionLevel): CompressLevel {
  if (level === "low") return "low";
  if (level === "extreme") return "high";
  return "med";
}

/**
 * Create the unified PDF engine from an env adapter bundle.
 * Tool packages implement logic; this factory wires them onto one `Gopdf` facade.
 *
 * RFC 0058 §2.4: host may reuse one `Uint8Array` across many `engine.*` calls —
 * every method clones at the facade before adapters or pdf.js can detach buffers.
 */
export function createEngine(adapter: GopdfAdapter): Gopdf {
  const wasm = adapter.engine;
  const runtime = createGopdfRuntime(adapter);
  const gopdf = { adapter } as Gopdf;

  Object.assign(gopdf, {
    encodeImages: (
      pixelsFlat: Uint8Array,
      widths: number[],
      heights: number[],
      format: Parameters<Gopdf["encodeImages"]>[3],
      quality?: number,
    ) => wasm.encodeImages(pixelsFlat, widths, heights, format, quality),

    linearizePdf: (bytes: Uint8Array) => wasm.linearizePdf(ownPdfBytes(bytes)),

    loadDocument: (bytes: Uint8Array) => adapter.pdfjs.loadDocument(ownPdfBytes(bytes)),

    compressPdf: (
      bytes: Uint8Array,
      level: CompressionLevel,
      onProgress?: (fraction: number) => void,
    ) =>
      shrinkCompress(ownPdfBytes(bytes), runtime, mapCompressionLevel(level), (percent) =>
        onProgress?.(percent / 100),
      ),

    grayscalePdf: (
      bytes: Uint8Array,
      options: Parameters<Gopdf["grayscalePdf"]>[1],
      onProgress?: Parameters<Gopdf["grayscalePdf"]>[2],
    ) => grayscalePdf(ownPdfBytes(bytes), runtime, options, onProgress),

    redactPdf: (
      bytes: Uint8Array,
      regions: Parameters<Gopdf["redactPdf"]>[1],
      options?: Parameters<Gopdf["redactPdf"]>[2],
      onProgress?: Parameters<Gopdf["redactPdf"]>[3],
    ) => redactPdf(ownPdfBytes(bytes), runtime, regions, options, onProgress),

    repairPdf: (
      bytes: Uint8Array,
      options?: Parameters<typeof repairPdf>[2],
      onProgress?: Parameters<typeof repairPdf>[3],
    ) => repairPdf(ownPdfBytes(bytes), runtime, options, onProgress),

    repairPdfBatch: (
      inputs: Parameters<typeof repairPdfBatch>[0],
      options?: Parameters<typeof repairPdfBatch>[2],
      onFileProgress?: Parameters<typeof repairPdfBatch>[3],
      onPageProgress?: Parameters<typeof repairPdfBatch>[4],
    ) =>
      repairPdfBatch(
        inputs.map((item) => ({ ...item, bytes: ownPdfBytes(item.bytes) })),
        runtime,
        options,
        onFileProgress,
        onPageProgress,
      ),

    pdfToJpeg: (bytes: Uint8Array, options?: Parameters<Gopdf["pdfToJpeg"]>[1]) =>
      pdfToJpeg(adapter, ownPdfBytes(bytes), options),

    pdfToText: (
      bytes: Uint8Array,
      options?: Parameters<Gopdf["pdfToText"]>[1],
      onProgress?: Parameters<Gopdf["pdfToText"]>[2],
    ) => pdfToText(adapter, ownPdfBytes(bytes), options, onProgress),

    ocr: (
      bytes: Uint8Array,
      lang?: string,
      onProgress?: Parameters<Gopdf["ocr"]>[2],
    ) => ocrPdf(adapter, ownPdfBytes(bytes), lang, onProgress),

    extractImages: (bytes: Uint8Array) => extractImages(ownPdfBytes(bytes), runtime),

    extractPdfTextRuns: (
      bytes: Uint8Array,
      onProgress?: Parameters<typeof extractPdfTextRuns>[2],
    ) => extractPdfTextRuns(ownPdfBytes(bytes), runtime, onProgress),

    pdfToWord: (
      bytes: Uint8Array,
      onProgress?: Parameters<typeof pdfToWord>[2],
    ) => pdfToWord(ownPdfBytes(bytes), runtime, onProgress),

    pdfToExcel: (
      bytes: Uint8Array,
      exportOptions: Parameters<typeof pdfToExcel>[2],
      onProgress?: Parameters<typeof pdfToExcel>[3],
      detectOptions?: Parameters<typeof pdfToExcel>[4],
    ) => pdfToExcel(ownPdfBytes(bytes), runtime, exportOptions, onProgress, detectOptions),

    pdfToPpt: (
      bytes: Uint8Array,
      options: Parameters<typeof pdfToPpt>[2],
      onProgress?: Parameters<typeof pdfToPpt>[3],
    ) => pdfToPpt(ownPdfBytes(bytes), runtime, options, onProgress),

    pdfToEpub: (
      bytes: Uint8Array,
      options: Parameters<typeof pdfToEpub>[2],
      onProgress?: Parameters<typeof pdfToEpub>[3],
    ) => pdfToEpub(ownPdfBytes(bytes), runtime, options, onProgress),

    mergePdfs: (inputs: Uint8Array[]) => mergePdfs(ownPdfBytesList(inputs)),
    splitPdf: (bytes: Uint8Array, ranges: number[][]) => splitPdf(ownPdfBytes(bytes), ranges),
    rotatePdf: (bytes: Uint8Array, rotation: 90 | 180 | 270, pageIndices: number[] | "all") =>
      rotatePdf(ownPdfBytes(bytes), rotation, pageIndices),
    protectPdf: (bytes: Uint8Array, password: string) => protectPdf(ownPdfBytes(bytes), password),
    unlockPdf: (bytes: Uint8Array, password: string) => unlockPdf(ownPdfBytes(bytes), password),
    organizePdf: (bytes: Uint8Array, order: number[]) => organizePdf(ownPdfBytes(bytes), order),
    cropPdf: (
      bytes: Uint8Array,
      margins: { top: number; bottom: number; left: number; right: number },
    ) => cropPdf(ownPdfBytes(bytes), margins),
    jpgToPdf: (images: Parameters<typeof jpgToPdf>[0]) =>
      jpgToPdf(
        images.map((image) => ({
          ...image,
          bytes: ownPdfBytes(image.bytes),
        })),
      ),
    watermarkPdf: (
      bytes: Uint8Array,
      content: Parameters<Gopdf["watermarkPdf"]>[1],
      opts: Parameters<Gopdf["watermarkPdf"]>[2],
    ) => watermarkPdf(ownPdfBytes(bytes), content, opts),
    signPdf: (bytes: Uint8Array, pngBytes: Uint8Array, placement: Parameters<Gopdf["signPdf"]>[2]) =>
      signPdf(ownPdfBytes(bytes), ownPdfBytes(pngBytes), placement),
    halvePdf: (bytes: Uint8Array, opts: Parameters<Gopdf["halvePdf"]>[1]) =>
      halvePdf(ownPdfBytes(bytes), opts),
    nUpPdf: (bytes: Uint8Array, opts: Parameters<Gopdf["nUpPdf"]>[1]) =>
      nUpPdf(ownPdfBytes(bytes), opts),
    fillPdfForm: (
      bytes: Uint8Array,
      values: Parameters<Gopdf["fillPdfForm"]>[1],
      options?: Parameters<Gopdf["fillPdfForm"]>[2],
      fields?: Parameters<Gopdf["fillPdfForm"]>[3],
    ) => fillPdfForm(ownPdfBytes(bytes), values, options, fields),
    addHeaderFooter: (bytes: Uint8Array, opts: Parameters<Gopdf["addHeaderFooter"]>[1]) =>
      addHeaderFooter(ownPdfBytes(bytes), opts),
    addPageNumbers: (bytes: Uint8Array, opts: Parameters<Gopdf["addPageNumbers"]>[1]) =>
      addPageNumbers(ownPdfBytes(bytes), opts),
    applyNativeTextEdits: (bytes: Uint8Array, edits: Parameters<Gopdf["applyNativeTextEdits"]>[1]) =>
      applyNativeTextEdits(ownPdfBytes(bytes), edits),

    analyzePdf: (bytes: Uint8Array, meta?: Parameters<Gopdf["analyzePdf"]>[1]) =>
      analyzePdf(ownPdfBytes(bytes), runtime, meta),

    applyEdits: (bytes: Uint8Array, annotations: Parameters<Gopdf["applyEdits"]>[1]) =>
      applyEdits(ownPdfBytes(bytes), annotations),

    htmlToPdf,
    markdownToHtml,
  });

  return gopdf;
}
