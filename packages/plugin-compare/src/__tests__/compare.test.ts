import { describe, it, expect } from "vitest";
import { COMPARE_DISPLAY_SCALE, COMPARE_MAX_PAGE_PIXELS } from "../constants";
import { computeCompareRenderScale, mergePageBoxes, cloneCanvas } from "../renderPage";
import { findWordsByOffsetRange, mergeLineRects } from "../textDiff";
import type { PositionedWord } from "../types";

describe("computeCompareRenderScale", () => {
    it("keeps base scale when under pixel budget", () => {
        expect(computeCompareRenderScale(612, 792, COMPARE_DISPLAY_SCALE)).toBe(
            COMPARE_DISPLAY_SCALE,
        );
    });

    it("reduces scale when page exceeds max pixels", () => {
        const scale = computeCompareRenderScale(2000, 3000, COMPARE_DISPLAY_SCALE);
        expect(2000 * scale * 3000 * scale).toBeLessThanOrEqual(COMPARE_MAX_PAGE_PIXELS);
        expect(scale).toBeLessThan(COMPARE_DISPLAY_SCALE);
    });
});

describe("mergePageBoxes", () => {
    it("uses max width and height from both boxes", () => {
        expect(
            mergePageBoxes({ width: 100, height: 200 }, { width: 150, height: 180 }),
        ).toEqual({ width: 150, height: 200 });
    });
});

describe("cloneCanvas", () => {
    it("returns null for zero-sized canvas", () => {
        const empty = document.createElement("canvas");
        empty.width = 0;
        empty.height = 0;
        expect(cloneCanvas(empty)).toBeNull();
        expect(cloneCanvas(null)).toBeNull();
    });

    it("copies pixel dimensions", () => {
        const source = document.createElement("canvas");
        source.width = 10;
        source.height = 20;
        const clone = cloneCanvas(source);
        expect(clone?.width).toBe(10);
        expect(clone?.height).toBe(20);
    });
});

describe("mergeLineRects", () => {
    const word = (
        partial: Partial<PositionedWord> & Pick<PositionedWord, "charOffset" | "x" | "y">,
    ): PositionedWord => ({
        str: "x",
        w: 10,
        h: 12,
        pageIndex: 0,
        ...partial,
    });

    it("returns empty array for no words", () => {
        expect(mergeLineRects([], 1)).toEqual([]);
    });

    it("merges words on the same line into one rect", () => {
        const words = [
            word({ charOffset: 0, x: 10, y: 100 }),
            word({ charOffset: 2, x: 25, y: 101, w: 15 }),
        ];
        const rects = mergeLineRects(words, 2);
        expect(rects).toHaveLength(1);
        expect(rects[0]).toMatchObject({
            x: 20,
            y: 200,
            width: 60,
            height: 24,
            pageIndex: 0,
        });
    });

    it("splits rects across different lines", () => {
        const words = [
            word({ charOffset: 0, x: 10, y: 100 }),
            word({ charOffset: 2, x: 10, y: 130 }),
        ];
        expect(mergeLineRects(words, 1)).toHaveLength(2);
    });
});

describe("findWordsByOffsetRange", () => {
    const words: PositionedWord[] = [
        { str: "hello", charOffset: 0, x: 0, y: 0, w: 50, h: 12, pageIndex: 0 },
        { str: "world", charOffset: 6, x: 60, y: 0, w: 50, h: 12, pageIndex: 0 },
    ];
    const offsets = [0, 6];

    it("finds words overlapping char range", () => {
        expect(findWordsByOffsetRange(words, offsets, 0, 5)).toEqual([words[0]]);
        expect(findWordsByOffsetRange(words, offsets, 6, 5)).toEqual([words[1]]);
    });

    it("returns empty for zero length", () => {
        expect(findWordsByOffsetRange(words, offsets, 0, 0)).toEqual([]);
    });
});
