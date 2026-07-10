export { repairPdf, repairPdfBatch } from "./repairPdf";
export { scanPdfObjects } from "./scanPdfObjects";
export { rebuildViaPdfLib } from "./rebuildViaPdfLib";
export { rebuildViaXrefSurgery } from "./rebuildViaXrefSurgery";
export { rebuildViaPdfJs } from "./rebuildViaPdfJs";
export { validatePdfOpenable } from "./validatePdfOpenable";
export { buildRepairedZip } from "./buildRepairedZip";
export { collectPdfObjectEntries } from "./collectPdfObjects";
export { REPAIR_RENDER_SCALE, REPAIR_STRATEGY } from "./constants";
export type {
  RepairStrategy,
  ObjectScanResult,
  RepairReport,
  RepairPdfResult,
  RepairPdfOptions,
  RepairProgressCallback,
  BatchRepairItemResult,
  BatchRepairResult,
  BatchFileProgressCallback,
} from "./types";
