import { describe, it, expect, vi } from "vitest";
import { renderPdfToCanvas, startPdfPageRender } from "../renderPage";

function mockCanvas() {
    const canvas = { width: 0, height: 0 } as any;
    const ctx = {} as any;
    canvas.getContext = vi.fn().mockReturnValue(ctx);
    return { canvas, ctx };
}

describe("startPdfPageRender", () => {
    it("sets canvas size and starts render with canvas element", () => {
        const { canvas, ctx } = mockCanvas();
        const task = { promise: Promise.resolve() };
        const render = vi.fn().mockReturnValue(task);
        const viewport = { width: 300, height: 400 };
        const page = {
            getViewport: vi.fn().mockReturnValue(viewport),
            render,
        };

        const result = startPdfPageRender(page as never, canvas, 1.5);

        expect(page.getViewport).toHaveBeenCalledWith({ scale: 1.5 });
        expect(canvas.width).toBe(300);
        expect(canvas.height).toBe(400);
        expect(render).toHaveBeenCalledWith({ canvasContext: ctx, viewport });
        expect(result.task).toBe(task);
        expect(result.width).toBe(300);
    });
});

describe("renderPdfToCanvas", () => {
    it("awaits render completion", async () => {
        const { canvas } = mockCanvas();
        const page = {
            getViewport: vi.fn().mockReturnValue({ width: 100, height: 200 }),
            render: vi.fn().mockReturnValue({ promise: Promise.resolve() }),
        };

        const size = await renderPdfToCanvas(page as never, canvas, 1);
        expect(size).toEqual({ width: 100, height: 200 });
    });
});
