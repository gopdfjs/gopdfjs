import { describe, expect, it } from "vitest";
import { clonePdfBytes } from "../bytes";

describe("clonePdfBytes", () => {
  it("returns an independent copy", () => {
    const src = new Uint8Array([1, 2, 3]);
    const copy = clonePdfBytes(src);
    expect(copy).toEqual(src);
    expect(copy.buffer).not.toBe(src.buffer);
  });
});
