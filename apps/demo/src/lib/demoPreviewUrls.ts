import type { ToolRunResult } from "./toolRunners";
import { createPdfPreviewUrl, revokePreviewUrl } from "./pdfBlobPreview";

export type DemoPreviewState = {
  inputPdfUrl: string | null;
  outputPdfUrl: string | null;
  jpegThumbs: { url: string; label: string }[];
  imageThumbs: { url: string; label: string }[];
};

export const EMPTY_PREVIEW: DemoPreviewState = {
  inputPdfUrl: null,
  outputPdfUrl: null,
  jpegThumbs: [],
  imageThumbs: [],
};

/** Revoke every object URL held in preview state. */
export function revokeDemoPreviews(state: DemoPreviewState): void {
  revokePreviewUrl(state.inputPdfUrl);
  revokePreviewUrl(state.outputPdfUrl);
  for (const item of state.jpegThumbs) revokePreviewUrl(item.url);
  for (const item of state.imageThumbs) revokePreviewUrl(item.url);
}

/** Build preview URLs from input PDF bytes and a tool run result. */
export function buildDemoPreviews(
  inputPdfBytes: Uint8Array | null | undefined,
  result: ToolRunResult | null,
): DemoPreviewState {
  const inputPdfUrl = inputPdfBytes?.byteLength ? createPdfPreviewUrl(inputPdfBytes) : null;
  let outputPdfUrl: string | null = null;
  const jpegThumbs: DemoPreviewState["jpegThumbs"] = [];
  const imageThumbs: DemoPreviewState["imageThumbs"] = [];

  if (result?.kind === "pdf") {
    outputPdfUrl = createPdfPreviewUrl(result.bytes);
  } else if (result?.kind === "jpeg-pages") {
    for (const page of result.pages) {
      const blob = new Blob([new Uint8Array(page.bytes)], { type: "image/jpeg" });
      jpegThumbs.push({ url: URL.createObjectURL(blob), label: `Page ${page.page}` });
    }
  } else if (result?.kind === "images") {
    for (const item of result.items) {
      imageThumbs.push({
        url: URL.createObjectURL(item.blob),
        label: `${item.name} (p.${item.page})`,
      });
    }
  }

  return { inputPdfUrl, outputPdfUrl, jpegThumbs, imageThumbs };
}
