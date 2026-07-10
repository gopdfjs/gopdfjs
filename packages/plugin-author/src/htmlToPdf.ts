import createDOMPurify from "dompurify";
import html2canvas from "html2canvas";
import { PDFDocument } from "pdf-lib";

export type PageSize = "a4" | "letter";
export type Orientation = "portrait" | "landscape";
export type MarginPreset = "none" | "normal" | "wide";

export interface HtmlToPdfOptions {
    pageSize: PageSize;
    orientation: Orientation;
    margin: MarginPreset;
    background: boolean;
}

export const DEFAULT_OPTIONS: HtmlToPdfOptions = {
    pageSize: "a4",
    orientation: "portrait",
    margin: "normal",
    background: true,
};

/** Page dimensions in PDF points (72 dpi). */
const PAGE_SIZES_PT: Record<PageSize, { width: number; height: number }> = {
    a4: { width: 595.28, height: 841.89 },
    letter: { width: 612, height: 792 },
};

const MARGIN_PT: Record<MarginPreset, number> = {
    none: 0,
    normal: 42.5, // 15 mm
    wide: 72, // 1 inch
};

/** CSS px per PDF point at 96 dpi rendering. */
const PX_PER_PT = 96 / 72;

/** Rasterization upscale for print sharpness. */
const RASTER_SCALE = 2;

/** Hard cap on output pages. */
export const MAX_PAGES = 50;

const SANITIZE_CONFIG = {
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "base", "meta", "link"],
    FORBID_ATTR: ["srcset"],
    USE_PROFILES: { html: true, svg: true },
};

let purifyInstance: ReturnType<typeof createDOMPurify> | null = null;

function getPurify() {
    if (typeof window === "undefined") {
        throw new Error("sanitizeHtml requires a browser DOM");
    }
    purifyInstance ??= createDOMPurify(window);
    return purifyInstance;
}

export function sanitizeHtml(source: string): string {
    return getPurify().sanitize(source, SANITIZE_CONFIG);
}

export function pageGeometry(options: HtmlToPdfOptions) {
    const base = PAGE_SIZES_PT[options.pageSize];
    const [widthPt, heightPt] =
        options.orientation === "portrait"
            ? [base.width, base.height]
            : [base.height, base.width];
    const marginPt = MARGIN_PT[options.margin];
    const contentWidthPt = widthPt - marginPt * 2;
    const contentHeightPt = heightPt - marginPt * 2;
    return {
        widthPt,
        heightPt,
        marginPt,
        contentWidthPt,
        contentHeightPt,
        contentWidthPx: Math.round(contentWidthPt * PX_PER_PT),
        contentHeightPx: Math.round(contentHeightPt * PX_PER_PT),
    };
}

/**
 * Find a clean horizontal cut line near `targetY` (canvas pixel space):
 * scan the band above the target for a row whose pixels are uniform,
 * so page breaks avoid slicing text lines in half.
 */
export function findCutLine(
    rowIsUniform: (y: number) => boolean,
    targetY: number,
    bandPx: number,
): number {
    for (let y = targetY; y > targetY - bandPx && y > 0; y--) {
        if (rowIsUniform(y)) return y;
    }
    return targetY;
}

function makeRowScanner(ctx: CanvasRenderingContext2D, width: number): (y: number) => boolean {
    return (y: number) => {
        const row = ctx.getImageData(0, y, width, 1).data;
        const r = row[0], g = row[1], b = row[2];
        for (let i = 4; i < row.length; i += 4) {
            if (Math.abs(row[i] - r) > 8 || Math.abs(row[i + 1] - g) > 8 || Math.abs(row[i + 2] - b) > 8) {
                return false;
            }
        }
        return true;
    };
}

async function waitForAssets(container: HTMLElement, timeoutMs = 8000): Promise<void> {
    const images = Array.from(container.querySelectorAll("img"));
    const loads = images.map(
        (img) =>
            new Promise<void>((resolve) => {
                if (img.complete) return resolve();
                img.onload = () => resolve();
                img.onerror = () => {
                    img.style.visibility = "hidden"; // placeholder box, no broken glyph
                    resolve();
                };
            }),
    );
    const timeout = new Promise<void>((r) => setTimeout(r, timeoutMs));
    await Promise.race([Promise.all([document.fonts.ready, ...loads]), timeout]);
}

export interface HtmlToPdfResult {
    bytes: Uint8Array;
    pageCount: number;
    truncated: boolean;
}

/**
 * Render sanitized HTML offscreen, rasterize, paginate, and assemble a PDF.
 * `html` must already be sanitized via `sanitizeHtml`.
 */
export async function htmlToPdf(
    html: string,
    options: HtmlToPdfOptions = DEFAULT_OPTIONS,
    onProgress?: (percent: number, step: string) => void,
): Promise<HtmlToPdfResult> {
    const geo = pageGeometry(options);
    onProgress?.(5, "render");

    const container = document.createElement("div");
    container.style.cssText = `position:fixed;left:-10000px;top:0;width:${geo.contentWidthPx}px;background:${options.background ? "transparent" : "#ffffff"};`;
    container.innerHTML = html;
    document.body.appendChild(container);

    try {
        await waitForAssets(container);
        onProgress?.(20, "rasterize");

        const tall = await html2canvas(container, {
            scale: RASTER_SCALE,
            backgroundColor: "#ffffff",
            logging: false,
        });

        onProgress?.(55, "paginate");
        const ctx = tall.getContext("2d");
        if (!ctx) throw new Error("Canvas 2D context unavailable");

        const pageHeightCanvasPx = Math.floor(geo.contentHeightPx * RASTER_SCALE);
        const bandPx = Math.floor(40 * RASTER_SCALE);
        const rowIsUniform = makeRowScanner(ctx, tall.width);

        const cuts: { start: number; end: number }[] = [];
        let y = 0;
        while (y < tall.height && cuts.length < MAX_PAGES) {
            const target = Math.min(y + pageHeightCanvasPx, tall.height);
            const end = target < tall.height ? findCutLine(rowIsUniform, target, bandPx) : target;
            // Guard: a degenerate cut (no progress) falls back to the hard target
            cuts.push({ start: y, end: end > y ? end : target });
            y = end > y ? end : target;
        }
        const truncated = y < tall.height;

        onProgress?.(65, "assemble");
        const pdfDoc = await PDFDocument.create();
        const slice = document.createElement("canvas");
        const sliceCtx = slice.getContext("2d")!;

        for (let i = 0; i < cuts.length; i++) {
            const { start, end } = cuts[i];
            const sliceH = end - start;
            slice.width = tall.width;
            slice.height = sliceH;
            sliceCtx.fillStyle = "#ffffff";
            sliceCtx.fillRect(0, 0, slice.width, sliceH);
            sliceCtx.drawImage(tall, 0, start, tall.width, sliceH, 0, 0, tall.width, sliceH);

            const blob = await new Promise<Blob>((resolve, reject) =>
                slice.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/jpeg", 0.92),
            );
            const jpg = await pdfDoc.embedJpg(new Uint8Array(await blob.arrayBuffer()));

            const page = pdfDoc.addPage([geo.widthPt, geo.heightPt]);
            const imgHPt = (sliceH / tall.width) * geo.contentWidthPt;
            page.drawImage(jpg, {
                x: geo.marginPt,
                y: geo.heightPt - geo.marginPt - imgHPt,
                width: geo.contentWidthPt,
                height: imgHPt,
            });

            onProgress?.(65 + Math.round(((i + 1) / cuts.length) * 30), "assemble");
            // Yield to keep the main thread responsive between slices
            await new Promise((r) => setTimeout(r, 0));
        }

        releaseCanvas(slice);
        releaseCanvas(tall);
        onProgress?.(100, "done");
        return { bytes: await pdfDoc.save(), pageCount: cuts.length, truncated };
    } finally {
        container.remove();
    }
}

function releaseCanvas(canvas: HTMLCanvasElement) {
    canvas.width = 0;
    canvas.height = 0;
}
