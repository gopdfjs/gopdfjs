import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { PDF_FIXTURES } from "@gopdfjs/fixtures";
import type { GopdfRuntime } from "@gopdfjs/runtime";
import { analyzePdf } from "../understand";

function mockRuntime(): GopdfRuntime {
  const page = {
    getViewport: ({ scale }: { scale: number }) => ({
      width: 200 * scale,
      height: 200 * scale,
    }),
    getOperatorList: async () => ({ fnArray: [], argsArray: [] }),
    commonObjs: { get: async () => ({}) },
  };

  return {
    loadDocument: async () => ({ numPages: 1, getPage: async () => page }),
    getPdfOps: async () => ({}),
    createCanvas: async () => ({
      width: 1,
      height: 1,
      getContext2d: () => ({}) as CanvasRenderingContext2D,
      toImageBytes: async () => new Uint8Array(),
      dispose: async () => undefined,
    }),
  };
}

describe("analyzePdf", () => {
  it("returns metadata for a readable PDF", async () => {
    const bytes = new Uint8Array(fs.readFileSync(PDF_FIXTURES.BMAUPIN_BASIC));
    const result = await analyzePdf(bytes, mockRuntime(), { fileName: "basic.pdf" });
    expect(result.pages).toBeGreaterThan(0);
    expect(result.fileName).toBe("basic.pdf");
    expect(result.isEncrypted).toBe(false);
  });

  it("accepts optional meta overrides", async () => {
    const bytes = new Uint8Array(fs.readFileSync(PDF_FIXTURES.BMAUPIN_BASIC));
    const result = await analyzePdf(bytes, mockRuntime(), {
      fileName: "custom.pdf",
      fileSizeBytes: 1234,
    });
    expect(result.fileName).toBe("custom.pdf");
  });
});
