/** Max render scale (PDF points → CSS px). */
export const MAX_DISPLAY_SCALE = 1.5;

/** Horizontal padding on canvas stage (`p-8` × 2). */
export const STAGE_PADDING_PX = 64;

/** Min container width before we trust a ResizeObserver reading. */
export const MIN_CONTAINER_WIDTH_PX = 120;

/**
 * Scale PDF for display: use MAX_DISPLAY_SCALE when the page fits at that size;
 * only shrink when the page would overflow the container width.
 */
export function computeFitDisplayScale(
    pageWidthPt: number,
    containerWidthPx: number,
    maxScale: number = MAX_DISPLAY_SCALE,
): number {
    if (containerWidthPx < MIN_CONTAINER_WIDTH_PX) return maxScale;

    const availW = containerWidthPx - STAGE_PADDING_PX;
    const naturalWidth = pageWidthPt * maxScale;
    if (naturalWidth <= availW) return maxScale;

    return availW / pageWidthPt;
}

/** Pixel size of one PDF page at the given display scale. */
export function pageDisplaySize(
    pageWidthPt: number,
    pageHeightPt: number,
    displayScale: number,
): { width: number; height: number } {
    return {
        width: pageWidthPt * displayScale,
        height: pageHeightPt * displayScale,
    };
}
