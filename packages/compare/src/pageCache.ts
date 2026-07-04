import type { ComparePdfDocument } from "./pdfTypes";
import { COMPARE_PAGE_WINDOW_RADIUS } from "./constants";
import type { PagePairRender, VisualDiffResult } from "./types";
import {
    computeCompareRenderScale,
    getPageBoxPt,
    mergePageBoxes,
    releaseCanvas,
    renderPageIntoBox,
} from "./renderPage";
import { visualDiffCanvas } from "./visualDiff";

type CachedPair = PagePairRender & {
    visual?: VisualDiffResult;
};

/** LRU-ish cache for rendered page pairs (current ± window). */
export class ComparePageCache {
    private cache = new Map<number, CachedPair>();

    constructor(
        private docA: ComparePdfDocument,
        private docB: ComparePdfDocument,
    ) {}

    private pageCount = () => Math.max(this.docA.numPages, this.docB.numPages);

    private allowedKeys(center: number): Set<number> {
        const keys = new Set<number>();
        const max = this.pageCount();
        for (let i = center - COMPARE_PAGE_WINDOW_RADIUS; i <= center + COMPARE_PAGE_WINDOW_RADIUS; i++) {
            if (i >= 0 && i < max) keys.add(i);
        }
        return keys;
    }

    evictOutside(center: number) {
        const allowed = this.allowedKeys(center);
        for (const key of this.cache.keys()) {
            if (!allowed.has(key)) {
                const entry = this.cache.get(key)!;
                releaseCanvas(entry.canvasA);
                releaseCanvas(entry.canvasB);
                releaseCanvas(entry.visual?.diffCanvas ?? null);
                this.cache.delete(key);
            }
        }
    }

    async getPagePair(pageIndex: number): Promise<PagePairRender> {
        this.evictOutside(pageIndex);
        const hit = this.cache.get(pageIndex);
        if (hit) return hit;

        const pageA = pageIndex < this.docA.numPages ? await this.docA.getPage(pageIndex + 1) : null;
        const pageB = pageIndex < this.docB.numPages ? await this.docB.getPage(pageIndex + 1) : null;

        const boxA = pageA ? await getPageBoxPt(pageA) : { width: 612, height: 792 };
        const boxB = pageB ? await getPageBoxPt(pageB) : { width: 612, height: 792 };
        const box = mergePageBoxes(boxA, boxB);
        const scale = computeCompareRenderScale(box.width, box.height);

        const canvasA = pageA ? await renderPageIntoBox(pageA, box, scale) : null;
        const canvasB = pageB ? await renderPageIntoBox(pageB, box, scale) : null;

        const entry: CachedPair = {
            canvasA,
            canvasB,
            widthPx: Math.ceil(box.width * scale),
            heightPx: Math.ceil(box.height * scale),
            scale,
        };
        this.cache.set(pageIndex, entry);
        return entry;
    }

    async getVisualDiff(pageIndex: number): Promise<VisualDiffResult | null> {
        const pair = await this.getPagePair(pageIndex);
        if (!pair.canvasA || !pair.canvasB) return null;

        const cached = this.cache.get(pageIndex)!;
        if (cached.visual) return cached.visual;

        if (pair.canvasA.width !== pair.canvasB.width || pair.canvasA.height !== pair.canvasB.height) {
            return null;
        }

        cached.visual = visualDiffCanvas(pair.canvasA, pair.canvasB);
        return cached.visual;
    }

    clear() {
        for (const entry of this.cache.values()) {
            releaseCanvas(entry.canvasA);
            releaseCanvas(entry.canvasB);
            releaseCanvas(entry.visual?.diffCanvas ?? null);
        }
        this.cache.clear();
    }
}
