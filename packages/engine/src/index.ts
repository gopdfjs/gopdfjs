/**
 * Consumer-facing `@gopdfjs/engine` entry.
 *
 * Import **`Gopdf` types** and **`createEngine(adapter)`** here only.
 * Env-specific hosts supply the adapter port bundle (browser / Node packages); engine does not import them.
 */

export type * from "./types";
export { createEngine } from "./createEngine";

export {
  fabricObjectsToAnnotations,
  computeFitDisplayScale,
  pageDisplaySize,
  scaleSerializedFabricObjects,
  FABRIC_SERIALIZE_FIELDS,
} from "../../plugin-annotate/src/index";

export {
  viewportRectToPdfRegion,
  pdfRegionToCanvasRect,
} from "../../plugin-redact/src/index";
