import { describe, it, expect } from "vitest";
import {
    DISPLAY_SCALE,
    fabricObjectsToAnnotations,
    type SerializedFabricObject,
} from "../fabricAnnotations";

const PAGE = { width: 600, height: 400 };

describe("fabricObjectsToAnnotations", () => {
    it("maps rect Fabric coords to PDF bottom-left space", async () => {
        const cw = PAGE.width * DISPLAY_SCALE;
        const ch = PAGE.height * DISPLAY_SCALE;
        const left = 80;
        const top = 80;
        const width = 200;
        const height = 100;

        const objects: Record<number, SerializedFabricObject[]> = {
            0: [{
                annotationType: "rect",
                left,
                top,
                width,
                height,
                scaleX: 1,
                scaleY: 1,
                stroke: "#e11d48",
            }],
        };

        const [ann] = await fabricObjectsToAnnotations(objects, [PAGE], {
            createId: () => "test-id",
        });

        expect(ann.type).toBe("rect");
        expect(ann.pageIndex).toBe(0);
        expect(ann.x).toBeCloseTo((left / cw) * PAGE.width);
        expect(ann.y).toBeCloseTo(PAGE.height - ((top + height) / ch) * PAGE.height);
        expect(ann.width).toBeCloseTo((width / cw) * PAGE.width);
        expect(ann.height).toBeCloseTo((height / ch) * PAGE.height);
        expect(ann.color).toBe("#e11d48");
    });

    it("applies scaleX/scaleY when mapping rect size", async () => {
        const objects: Record<number, SerializedFabricObject[]> = {
            0: [{
                annotationType: "rect",
                left: 0,
                top: 0,
                width: 100,
                height: 50,
                scaleX: 2,
                scaleY: 1.5,
                stroke: "#000",
            }],
        };

        const [ann] = await fabricObjectsToAnnotations(objects, [PAGE], {
            createId: () => "id",
        });

        const cw = PAGE.width * DISPLAY_SCALE;
        const ch = PAGE.height * DISPLAY_SCALE;
        expect(ann.width).toBeCloseTo((200 / cw) * PAGE.width);
        expect(ann.height).toBeCloseTo((75 / ch) * PAGE.height);
    });

    it("maps text baseline Y without object height", async () => {
        const top = 120;
        const objects: Record<number, SerializedFabricObject[]> = {
            0: [{
                annotationType: "text",
                type: "i-text",
                left: 40,
                top,
                text: "Hello",
                fontSize: 27,
                fill: "#111827",
            }],
        };

        const [ann] = await fabricObjectsToAnnotations(objects, [PAGE], {
            createId: () => "id",
        });

        const ch = PAGE.height * DISPLAY_SCALE;
        expect(ann.type).toBe("text");
        expect(ann.text).toBe("Hello");
        expect(ann.y).toBeCloseTo(PAGE.height - (top / ch) * PAGE.height);
        expect(ann.fontSize).toBeCloseTo(27 / DISPLAY_SCALE);
    });

    it("embeds image annotation from data URL src", async () => {
        const png =
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
        const objects: Record<number, SerializedFabricObject[]> = {
            0: [{
                annotationType: "image",
                left: 10,
                top: 20,
                width: 40,
                height: 30,
                scaleX: 1,
                scaleY: 1,
                src: png,
            }],
        };

        const [ann] = await fabricObjectsToAnnotations(objects, [PAGE], {
            createId: () => "img",
        });

        expect(ann.type).toBe("image");
        expect(ann.image).toBeInstanceOf(File);
        expect(ann.image?.type).toMatch(/png/);
        expect(ann.width).toBeGreaterThan(0);
        expect(ann.height).toBeGreaterThan(0);
    });
});
