import type { TextItem } from "pdfjs-dist/types/src/display/api";
import type { GopdfRuntime } from "@gopdfjs/runtime";
import { buildPresentation } from "./buildPresentation";
import { SLIDE_LAYOUTS } from "./constants";
import { extractTextBoxesFromItems } from "./extractTextBoxes";
import { renderPageBackgroundDataUrl } from "./renderPageImage";
import type { PdfToPptOptions, PdfToPptProgress, SlidePageContent } from "./types";

export type { PdfToPptOptions, PdfToPptProgress, PptTemplate, SlideLayout, SlideTextBox } from "./types";

/** Convert selected PDF pages to an editable PowerPoint file. */
export async function pdfToPpt(
  bytes: Uint8Array,
  runtime: GopdfRuntime,
  options: PdfToPptOptions,
  onProgress?: (progress: PdfToPptProgress) => void,
): Promise<Blob> {
  const pdf = await runtime.loadDocument(bytes);
  const indices = [...options.pageIndices].sort((a, b) => a - b);
  const layout = SLIDE_LAYOUTS[options.slideLayout];
  const pages: SlidePageContent[] = [];

  for (let i = 0; i < indices.length; i++) {
    const pageIndex = indices[i];
    onProgress?.({ current: i + 1, total: indices.length });

    const page = await pdf.getPage(pageIndex + 1);
    const baseViewport = page.getViewport({ scale: 1 });
    const pageWidthPt = baseViewport.width;
    const pageHeightPt = baseViewport.height;

    const content = await page.getTextContent({ includeMarkedContent: false });
    const items = content.items.filter(
      (item): item is TextItem => "str" in item && item.str.trim().length > 0,
    );

    const textBoxes = extractTextBoxesFromItems(
      items,
      pageWidthPt,
      pageHeightPt,
      layout.widthIn,
      layout.heightIn,
    );

    let backgroundDataUrl: string | undefined;
    if (options.template === "background-image") {
      backgroundDataUrl = await renderPageBackgroundDataUrl(page);
    }

    pages.push({
      pageIndex,
      pageWidthPt,
      pageHeightPt,
      backgroundDataUrl,
      textBoxes,
    });
  }

  return buildPresentation(pages, options);
}

export { extractTextBoxesFromItems, buildPresentation };
export { ptToSlideInches, pdfYToSlideTopInches } from "./coordinates";
