import { PDFDocument } from "pdf-lib";
import { mmToPt } from "./crop";

export { mmToPt };

/** Named ISO / US paper presets. Dimensions in PDF points (width × height). */
export type PaperPresetId = "a4" | "letter" | "legal" | "tabloid" | "custom";

export type ResizeMode = "fit" | "fill" | "stretch";

/** Uniform: same target box for every page. Per-page: target derived per source page. */
export type ResizeScope = "uniform" | "perPage";

export type ResizeTarget =
  | { preset: Exclude<PaperPresetId, "custom"> }
  | { preset: "custom"; widthMm: number; heightMm: number };

export type ResizePdfOptions = {
  target: ResizeTarget;
  mode: ResizeMode;
  scope: ResizeScope;
};

export type PdfRect = { x: number; y: number; width: number; height: number };

export const PAPER_PRESETS: Record<
  Exclude<PaperPresetId, "custom">,
  { width: number; height: number; labelKey: string }
> = {
  a4: { width: 595.28, height: 841.89, labelKey: "a4" },
  letter: { width: 612, height: 792, labelKey: "letter" },
  legal: { width: 612, height: 1008, labelKey: "legal" },
  tabloid: { width: 792, height: 1224, labelKey: "tabloid" },
};

/** Resolve target MediaBox from preset or custom millimeters. */
export function resolveTargetSize(target: ResizeTarget): { width: number; height: number } {
  if (target.preset === "custom") {
    return { width: mmToPt(target.widthMm), height: mmToPt(target.heightMm) };
  }
  const preset = PAPER_PRESETS[target.preset];
  return { width: preset.width, height: preset.height };
}

/**
 * Per-page scope swaps target width/height when the source page is landscape.
 * Uniform scope uses the same target box for every page.
 */
export function resolveTargetSizeForPage(
  target: ResizeTarget,
  srcW: number,
  srcH: number,
  scope: ResizeScope,
): { width: number; height: number } {
  const base = resolveTargetSize(target);
  if (scope === "uniform") return base;
  if (srcW > srcH) {
    return { width: base.height, height: base.width };
  }
  return base;
}

/** Compute drawPage rect in PDF user space (origin bottom-left). */
export function computeResizeDrawRect(
  mode: ResizeMode,
  srcW: number,
  srcH: number,
  targetW: number,
  targetH: number,
): PdfRect {
  if (mode === "stretch") {
    return { x: 0, y: 0, width: targetW, height: targetH };
  }

  const scale =
    mode === "fit"
      ? Math.min(targetW / srcW, targetH / srcH)
      : Math.max(targetW / srcW, targetH / srcH);

  const width = srcW * scale;
  const height = srcH * scale;
  return {
    x: (targetW - width) / 2,
    y: (targetH - height) / 2,
    width,
    height,
  };
}

/** Scale each source page onto a new target MediaBox; page count unchanged. */
export async function resizePdf(
  bytes: Uint8Array,
  options: ResizePdfOptions,
): Promise<Uint8Array> {
  const src = await PDFDocument.load(bytes);
  const out = await PDFDocument.create();

  for (const srcPage of src.getPages()) {
    const { width: sw, height: sh } = srcPage.getSize();
    const { width: tw, height: th } = resolveTargetSizeForPage(
      options.target,
      sw,
      sh,
      options.scope,
    );
    const destPage = out.addPage([tw, th]);
    const draw = computeResizeDrawRect(options.mode, sw, sh, tw, th);
    const embedded = await out.embedPage(srcPage);
    destPage.drawPage(embedded, draw);
  }

  return out.save();
}
