import { describe, it, expect } from "vitest";
import { scaleSerializedFabricObjects } from "../scaleSerializedFabricObjects";

describe("scaleSerializedFabricObjects", () => {
    it("scales positions and font size", () => {
        const scaled = scaleSerializedFabricObjects(
            [{ left: 100, top: 50, fontSize: 18 }],
            0.5,
        );
        expect(scaled[0]).toEqual({ left: 50, top: 25, fontSize: 9 });
    });

    it("returns same array when ratio is 1", () => {
        const objects = [{ left: 10, top: 20 }];
        expect(scaleSerializedFabricObjects(objects, 1)).toBe(objects);
    });
});
