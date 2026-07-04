import { describe, it, expect } from "vitest";
import { readFileAsArrayBuffer } from "../readFile";

describe("readFileAsArrayBuffer", () => {
    it("reads file bytes", async () => {
        const file = new File(["hello"], "a.txt", { type: "text/plain" });
        const buf = await readFileAsArrayBuffer(file);
        expect(new TextDecoder().decode(buf)).toBe("hello");
    });
});
