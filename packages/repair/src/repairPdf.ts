import {
  REPAIR_STRATEGY,
  WARN_PDF_LIB_FAILED,
  WARN_XREF_SURGERY_FAILED,
} from "./constants";
import { rebuildViaPdfJs } from "./rebuildViaPdfJs";
import { rebuildViaPdfLib } from "./rebuildViaPdfLib";
import { rebuildViaXrefSurgery } from "./rebuildViaXrefSurgery";
import { scanPdfObjects } from "./scanPdfObjects";
import type {
  BatchFileProgressCallback,
  BatchRepairItemResult,
  BatchRepairResult,
  RepairPdfOptions,
  RepairPdfResult,
  RepairProgressCallback,
  RepairStrategy,
} from "./types";
import { validatePdfOpenable } from "./validatePdfOpenable";

type RebuildSuccess = {
  bytes: Uint8Array;
  pageCount: number;
  inputPages: number;
  strategy: RepairStrategy;
};

async function tryRebuildPipeline(
  bytes: Uint8Array,
  options: RepairPdfOptions | undefined,
  warnings: string[],
  onProgress?: RepairProgressCallback,
): Promise<RebuildSuccess> {
  try {
    const rebuilt = await rebuildViaPdfLib(bytes, options);
    return {
      bytes: rebuilt.bytes,
      pageCount: rebuilt.pageCount,
      inputPages: rebuilt.pageCount,
      strategy: REPAIR_STRATEGY.PDF_LIB_REBUILD,
    };
  } catch {
    warnings.push(WARN_PDF_LIB_FAILED);
  }

  try {
    const surgicallyFixed = rebuildViaXrefSurgery(bytes);
    const rebuilt = await rebuildViaPdfLib(surgicallyFixed, options);
    return {
      bytes: rebuilt.bytes,
      pageCount: rebuilt.pageCount,
      inputPages: rebuilt.pageCount,
      strategy: REPAIR_STRATEGY.XREF_SURGERY_REBUILD,
    };
  } catch {
    warnings.push(WARN_XREF_SURGERY_FAILED);
  }

  const rebuilt = await rebuildViaPdfJs(bytes, options, onProgress);
  return {
    bytes: rebuilt.bytes,
    pageCount: rebuilt.pageCount,
    inputPages: rebuilt.inputPages,
    strategy: REPAIR_STRATEGY.PDFJS_RASTER_REBUILD,
  };
}

/**
 * Repair a corrupted PDF: scan, tiered rebuild (pdf-lib → xref surgery → raster).
 * Throws if no strategy produces a validated openable PDF.
 */
export async function repairPdf(
  file: File,
  options?: RepairPdfOptions,
  onProgress?: RepairProgressCallback,
): Promise<RepairPdfResult> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const scan = scanPdfObjects(bytes);
  const warnings: string[] = [];

  const rebuilt = await tryRebuildPipeline(bytes, options, warnings, onProgress);

  const validated = await validatePdfOpenable(rebuilt.bytes, options);
  if (!validated) {
    throw new Error("Repaired PDF failed openability validation");
  }

  return {
    bytes: rebuilt.bytes,
    report: {
      strategy: rebuilt.strategy,
      scan,
      inputPages: rebuilt.inputPages,
      outputPages: rebuilt.pageCount,
      warnings,
      validated,
    },
  };
}

/** Repair many PDFs sequentially; each item keeps its own report or error. */
export async function repairPdfBatch(
  files: File[],
  options?: RepairPdfOptions,
  onFileProgress?: BatchFileProgressCallback,
  onPageProgress?: RepairProgressCallback,
): Promise<BatchRepairResult> {
  const items: BatchRepairItemResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i]!;
    onFileProgress?.(i + 1, files.length, file.name);
    try {
      const result = await repairPdf(file, options, onPageProgress);
      items.push({ fileName: file.name, ok: true, result });
    } catch {
      items.push({ fileName: file.name, ok: false, errorMessage: "repair_failed" });
    }
  }

  return {
    items,
    successCount: items.filter((item) => item.ok).length,
  };
}
