import type { ComparePdfPage } from "./pdfTypes";
import { COMPARE_DISPLAY_SCALE, COMPARE_MAX_PAGE_PIXELS } from "./constants";

export type PageBoxPt = { width: number; height: number };

/** Clamp scale so rendered page stays under pixel budget. */
export function computeCompareRenderScale(
    boxWidthPt: number,
    boxHeightPt: number,
    baseScale = COMPARE_DISPLAY_SCALE,
): number {
    let scale = baseScale;
    while (boxWidthPt * scale * boxHeightPt * scale > COMPARE_MAX_PAGE_PIXELS && scale > 0.25) {
        scale *= 0.9;
    }
    return scale;
}

export function releaseCanvas(canvas: HTMLCanvasElement | null) {
    if (!canvas) return;
    canvas.width = 0;
    canvas.height = 0;
}

/** Copy canvas pixels so cache eviction cannot zero out consumer-owned refs. */
export function cloneCanvas(source: HTMLCanvasElement | null): HTMLCanvasElement | null {
    if (!source || source.width === 0 || source.height === 0) return null;
    const clone = document.createElement("canvas");
    clone.width = source.width;
    clone.height = source.height;
    clone.getContext("2d")?.drawImage(source, 0, 0);
    return clone;
}

/** Render one page into a white bounding box (top-left anchored). */
export async function renderPageIntoBox(
    page: ComparePdfPage,
    box: PageBoxPt,
    scale: number,
): Promise<HTMLCanvasElement> {
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(box.width * scale);
    canvas.height = Math.ceil(box.height * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const viewport = page.getViewport({ scale });
    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas;
}

/** Max media-box dimensions for a page pair. */
export function mergePageBoxes(a: PageBoxPt, b: PageBoxPt): PageBoxPt {
    return {
        width: Math.max(a.width, b.width),
        height: Math.max(a.height, b.height),
    };
}

export async function getPageBoxPt(page: ComparePdfPage): Promise<PageBoxPt> {
    const vp = page.getViewport({ scale: 1 });
    return { width: vp.width, height: vp.height };
}
