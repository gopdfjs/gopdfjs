import PptxGenJS from "pptxgenjs";
import { SLIDE_LAYOUTS } from "./constants";
import type { PdfToPptOptions, SlidePageContent } from "./types";

/** Assemble slide pages into a .pptx Blob. */
export async function buildPresentation(
  pages: SlidePageContent[],
  options: Pick<PdfToPptOptions, "slideLayout" | "template">,
): Promise<Blob> {
  const layout = SLIDE_LAYOUTS[options.slideLayout];
  const pptx = new PptxGenJS();
  pptx.layout = layout.pptLayout;

  for (const page of pages) {
    const slide = pptx.addSlide();

    if (options.template === "background-image" && page.backgroundDataUrl) {
      slide.background = { data: page.backgroundDataUrl };
    }

    for (const box of page.textBoxes) {
      slide.addText(box.text, {
        x: box.x,
        y: box.y,
        w: box.w,
        h: box.h,
        fontSize: box.fontSize,
        bold: box.bold,
        color: "000000",
        valign: "top",
        margin: 0,
      });
    }
  }

  if (pages.length === 0) {
    const slide = pptx.addSlide();
    slide.addText("No slides exported", { x: 0.5, y: 0.5, w: 9, h: 1, fontSize: 18 });
  }

  const output = await pptx.write({ outputType: "blob" });
  return output as Blob;
}
