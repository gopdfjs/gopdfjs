import { describe, expect, it, vi } from "vitest";
import { runCompressPdf } from "./run";

vi.mock("@gopdfjs/pdf-wasm", () => ({
  compressPdf: vi.fn(
    async (
      _input: Uint8Array,
      _level: string,
      onProgress?: (f: number) => void,
    ) => {
      onProgress?.(0);
      onProgress?.(1);
      return new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF
    },
  ),
}));

describe("runCompressPdf", () => {
  it("returns bytes and compression stats", async () => {
    const input = new Uint8Array(1000);
    const result = await runCompressPdf(input, "recommended");
    expect(result.bytes).toEqual(new Uint8Array([0x25, 0x50, 0x44, 0x46]));
    expect(result.stats.inputBytes).toBe(1000);
    expect(result.stats.outputBytes).toBe(4);
    expect(result.stats.savedRatio).toBeCloseTo(0.996);
  });

  it("forwards progress to callback", async () => {
    const percents: number[] = [];
    await runCompressPdf(new Uint8Array(10), "low", (p) => {
      percents.push(p.percent);
    });
    expect(percents).toContain(0);
    expect(percents).toContain(100);
  });
});
