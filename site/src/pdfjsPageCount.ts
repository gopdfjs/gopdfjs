import * as pdfjs from "pdfjs-dist";

/**
 * 使用 pdf.js（与主站一致）仅做「能否解析、多少页」探测；不涉及 Rust/WASM。
 */
export async function getPdfPageCount(bytes: Uint8Array): Promise<number> {
  if (typeof window !== "undefined") {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  }
  const loadingTask = pdfjs.getDocument({ data: bytes.slice(0) });
  const pdf = await loadingTask.promise;
  try {
    return pdf.numPages;
  } finally {
    await pdf.destroy();
  }
}
