import { describe, it, expect } from "vitest";
import {
    computeFitDisplayScale,
    MAX_DISPLAY_SCALE,
    STAGE_PADDING_PX,
    pageDisplaySize,
} from "../editCanvasScale";

describe("computeFitDisplayScale", () => {
    it("uses MAX_DISPLAY_SCALE when page fits at max scale", () => {
        expect(computeFitDisplayScale(612, 1000)).toBe(MAX_DISPLAY_SCALE);
    });

    it("uses MAX_DISPLAY_SCALE before container is measured", () => {
        expect(computeFitDisplayScale(612, 0)).toBe(MAX_DISPLAY_SCALE);
    });

    it("shrinks only when page would overflow container width", () => {
        const pageW = 612;
        const containerW = 400;
        const scale = computeFitDisplayScale(pageW, containerW);
        expect(scale).toBeCloseTo((containerW - STAGE_PADDING_PX) / pageW);
        expect(scale).toBeLessThan(MAX_DISPLAY_SCALE);
    });

    it("does not shrink below width-fit for short containers", () => {
        const scale = computeFitDisplayScale(612, 700);
        expect(scale).toBeCloseTo((700 - STAGE_PADDING_PX) / 612);
    });
});

describe("pageDisplaySize", () => {
    it("returns scaled dimensions", () => {
        expect(pageDisplaySize(612, 792, 1)).toEqual({ width: 612, height: 792 });
    });
});
