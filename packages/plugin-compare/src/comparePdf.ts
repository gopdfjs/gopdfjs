import type {
  ComparePdfTextOptions,
  CompareSession,
  TextDiffResult,
} from "@gopdfjs/plugin/domain";
import type { GopdfRuntime } from "@gopdfjs/runtime/runtime";
import { COMPARE_DISPLAY_SCALE } from "./constants";
import { ComparePageCache } from "./pageCache";
import { diffPdfText } from "./textDiff";

/** Text diff between two PDFs — plugin entry wired by `@gopdfjs/engine`. */
export async function comparePdfText(
  bytesA: Uint8Array,
  bytesB: Uint8Array,
  runtime: GopdfRuntime,
  options?: ComparePdfTextOptions,
): Promise<TextDiffResult> {
  const [docA, docB] = await Promise.all([
    runtime.loadDocument(bytesA),
    runtime.loadDocument(bytesB),
  ]);
  return diffPdfText(docA, docB, options?.displayScale ?? COMPARE_DISPLAY_SCALE);
}

/** Browser-only dual-pane compare session — plugin entry wired by `@gopdfjs/engine`. */
export async function createCompareSession(
  bytesA: Uint8Array,
  bytesB: Uint8Array,
  runtime: GopdfRuntime,
): Promise<CompareSession> {
  const [docA, docB] = await Promise.all([
    runtime.loadDocument(bytesA),
    runtime.loadDocument(bytesB),
  ]);
  const cache = new ComparePageCache(docA, docB);
  const pageCount = Math.max(docA.numPages, docB.numPages);

  return {
    pageCount,
    diffText: (options) =>
      diffPdfText(docA, docB, options?.displayScale ?? COMPARE_DISPLAY_SCALE),
    getPagePair: (pageIndex) => cache.getPagePair(pageIndex),
    getVisualDiff: (pageIndex) => cache.getVisualDiff(pageIndex),
    evictOutside: (center) => cache.evictOutside(center),
    clear: () => cache.clear(),
  };
}
