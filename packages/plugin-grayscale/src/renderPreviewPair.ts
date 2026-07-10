import type { GopdfRuntime } from "@gopdfjs/runtime";
import { rasterizeGrayscalePage } from "./rasterizeGrayscalePage";
import type { GrayscalePdfOptions, PreviewPair } from "./types";

function jpegBytesToDataUrl(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return `data:image/jpeg;base64,${btoa(binary)}`;
}

/** Render page 1 color vs grayscale thumbs for the UI preview. */
export async function renderPreviewPair(
  bytes: Uint8Array,
  runtime: GopdfRuntime,
  options: GrayscalePdfOptions,
  pageNumber = 1,
): Promise<PreviewPair> {
  const doc = await runtime.loadDocument(bytes);
  const page = await doc.getPage(pageNumber);
  const previewScale = 1;

  const color = await rasterizeGrayscalePage(
    page,
    runtime,
    options.mode,
    previewScale,
    options.jpegQuality,
    false,
  );
  const gray = await rasterizeGrayscalePage(
    page,
    runtime,
    options.mode,
    previewScale,
    options.jpegQuality,
    true,
  );

  return {
    colorDataUrl: jpegBytesToDataUrl(color.jpegBytes),
    grayDataUrl: jpegBytesToDataUrl(gray.jpegBytes),
  };
}
