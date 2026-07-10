import {
  REPAIR_STRATEGY,
  WARN_PDF_LIB_FAILED,
  WARN_XREF_SURGERY_FAILED,
} from "./constants";
import type { GopdfRuntime } from "@gopdfjs/runtime";
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
  runtime: GopdfRuntime,
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

  const rebuilt = await rebuildViaPdfJs(bytes, runtime, options, onProgress);
  return {
    bytes: rebuilt.bytes,
    pageCount: rebuilt.pageCount,
    inputPages: rebuilt.inputPages,
    strategy: REPAIR_STRATEGY.PDFJS_RASTER_REBUILD,
  };
}

/** Repair a corrupted PDF: scan, tiered rebuild (pdf-lib → xref surgery → raster). */
export async function repairPdf(
  bytes: Uint8Array,
  runtime: GopdfRuntime,
  options?: RepairPdfOptions,
  onProgress?: RepairProgressCallback,
): Promise<RepairPdfResult> {
  const scan = scanPdfObjects(bytes);
  const warnings: string[] = [];

  const rebuilt = await tryRebuildPipeline(bytes, runtime, options, warnings, onProgress);

  const validated = await validatePdfOpenable(rebuilt.bytes, runtime, options);
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

export type BatchPdfInput = { fileName: string; bytes: Uint8Array };

/** Repair many PDFs sequentially. */
export async function repairPdfBatch(
  inputs: BatchPdfInput[],
  runtime: GopdfRuntime,
  options?: RepairPdfOptions,
  onFileProgress?: BatchFileProgressCallback,
  onPageProgress?: RepairProgressCallback,
): Promise<BatchRepairResult> {
  const items: BatchRepairItemResult[] = [];

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i]!;
    onFileProgress?.(i + 1, inputs.length, input.fileName);
    try {
      const result = await repairPdf(input.bytes, runtime, options, onPageProgress);
      items.push({ fileName: input.fileName, ok: true, result });
    } catch {
      items.push({ fileName: input.fileName, ok: false, errorMessage: "repair_failed" });
    }
  }

  return {
    items,
    successCount: items.filter((item) => item.ok).length,
  };
}
