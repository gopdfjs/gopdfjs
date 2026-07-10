import pixelmatch from "pixelmatch";
import { PIXELMATCH_THRESHOLD } from "./constants";
import type { VisualDiffResult } from "./types";

/** Anti-aliasing-aware pixel diff between two same-size canvases. */
export function visualDiffCanvas(
    canvasA: HTMLCanvasElement,
    canvasB: HTMLCanvasElement,
): VisualDiffResult {
    const width = canvasA.width;
    const height = canvasA.height;

    const ctxA = canvasA.getContext("2d")!;
    const ctxB = canvasB.getContext("2d")!;
    const dataA = ctxA.getImageData(0, 0, width, height);
    const dataB = ctxB.getImageData(0, 0, width, height);
    const diffData = new Uint8ClampedArray(width * height * 4);

    const changedPixels = pixelmatch(dataA.data, dataB.data, diffData, width, height, {
        threshold: PIXELMATCH_THRESHOLD,
        includeAA: false,
    });

    const diffCanvas = document.createElement("canvas");
    diffCanvas.width = width;
    diffCanvas.height = height;
    diffCanvas.getContext("2d")!.putImageData(new ImageData(diffData, width, height), 0, 0);

    return { diffCanvas, changedPixels };
}
