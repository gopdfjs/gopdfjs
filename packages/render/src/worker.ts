import type * as PdfJs from "pdfjs-dist";

let pdfjsInstance: typeof PdfJs | null = null;

function isNodeRuntime(): boolean {
  // In Vitest/jsdom, `window` exists but we still run in Node and need legacy build.
  return typeof process !== "undefined" && Boolean(process.versions?.node);
}

/** Synchronously/Asynchronously load pdfjs-dist directly in Node environment. */
export async function getPdfjs(): Promise<typeof PdfJs> {
  if (pdfjsInstance) return pdfjsInstance;
  const mod = isNodeRuntime()
    ? await import("pdfjs-dist/legacy/build/pdf.mjs")
    : await import("pdfjs-dist");
  pdfjsInstance = mod as typeof PdfJs;
  return pdfjsInstance;
}

/** Lazy facade — existing call sites use `await pdfjs.getDocument(...).promise`. */
export const pdfjs = {
  getDocument(...args: Parameters<typeof PdfJs.getDocument>) {
    return {
      promise: getPdfjs().then((mod) => mod.getDocument(...args).promise),
    };
  },
  get OPS() {
    if (!pdfjsInstance) {
      throw new Error("pdf.js OPS is available after the first getDocument call");
    }
    return pdfjsInstance.OPS;
  },
} as typeof PdfJs;
