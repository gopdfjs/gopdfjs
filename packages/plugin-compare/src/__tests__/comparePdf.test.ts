import { describe, expect, it, vi } from "vitest";
import type { GopdfRuntime } from "@gopdfjs/runtime/runtime";
import { comparePdfText } from "../comparePdf";

describe("comparePdfText", () => {
  it("loads both PDFs via runtime and returns text diff result", async () => {
    const wordsA = [{ str: "hello", transform: [12, 0, 0, 12, 10, 100], width: 30 }];
    const wordsB = [{ str: "world", transform: [12, 0, 0, 12, 10, 100], width: 30 }];

    const makeDoc = (words: typeof wordsA) => ({
      numPages: 1,
      getPage: vi.fn(async () => ({
        getTextContent: vi.fn(async () => ({ items: words })),
        getViewport: vi.fn(() => ({ width: 612, height: 792 })),
        render: vi.fn(() => ({ promise: Promise.resolve() })),
      })),
    });

    const runtime: GopdfRuntime = {
      loadDocument: vi
        .fn()
        .mockResolvedValueOnce(makeDoc(wordsA))
        .mockResolvedValueOnce(makeDoc(wordsB)),
      getPdfOps: vi.fn(async () => ({})),
      createCanvas: vi.fn(async () => {
        throw new Error("not used");
      }),
    };

    const result = await comparePdfText(
      new Uint8Array([1]),
      new Uint8Array([2]),
      runtime,
      { displayScale: 1 },
    );

    expect(runtime.loadDocument).toHaveBeenCalledTimes(2);
    expect(result.hasTextLayer).toBe(true);
    expect(result.changes.length).toBeGreaterThan(0);
  });
});
