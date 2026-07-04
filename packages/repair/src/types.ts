import type { REPAIR_STRATEGY } from "./constants";
import type { ObjectScanResult } from "./scanPdfObjects";

export type { ObjectScanResult };

export type RepairStrategy = (typeof REPAIR_STRATEGY)[keyof typeof REPAIR_STRATEGY];

export type RepairPdfOptions = {
  /** User password for encrypted corrupted PDFs. */
  password?: string;
};

export type RepairReport = {
  strategy: RepairStrategy;
  scan: ObjectScanResult;
  inputPages: number | null;
  outputPages: number;
  warnings: string[];
  validated: boolean;
};

export type RepairPdfResult = {
  bytes: Uint8Array;
  report: RepairReport;
};

export type RepairProgressCallback = (current: number, total: number) => void;

export type BatchRepairItemResult = {
  fileName: string;
  ok: boolean;
  result?: RepairPdfResult;
  errorMessage?: string;
};

export type BatchRepairResult = {
  items: BatchRepairItemResult[];
  successCount: number;
};

export type BatchFileProgressCallback = (
  fileIndex: number,
  fileCount: number,
  fileName: string,
) => void;
