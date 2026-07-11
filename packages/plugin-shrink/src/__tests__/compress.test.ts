import { describe, expect, it, vi } from "vitest";
import type { GopdfRuntime } from "@gopdfjs/runtime";
import { compressPdf } from "../compress";

/** Plugin layer: only `GopdfRuntime` — never `@gopdfjs/adapter`. */
describe("compressPdf (plugin-shrink)", () => {
  it("loads document via runtime after pdf-lib", async () => {
    const loadDocument = vi.fn(async () => ({
      numPages: 1,
      getPage: async () => ({
        getOperatorList: async () => ({ fnArray: [] as number[], argsArray: [] as unknown[] }),
        objs: { get: (_id: string, cb: (v: null) => void) => cb(null) },
      }),
    }));
    const getPdfOps = vi.fn(async () => ({ paintImageXObject: 85 }));

    const runtime = {
      loadDocument,
      getPdfOps,
      createCanvas: vi.fn(),
    } as unknown as GopdfRuntime;

    const bytes = new Uint8Array(await createMinimalPdfBytes());
    const out = await compressPdf(bytes, runtime, "low", () => undefined);

    expect(loadDocument).toHaveBeenCalledWith(bytes);
    expect(getPdfOps).toHaveBeenCalled();
    expect(out).toBeInstanceOf(Uint8Array);
    expect(out.byteLength).toBeGreaterThan(0);
  });
});

async function createMinimalPdfBytes(): Promise<ArrayBuffer> {
  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  doc.addPage();
  return doc.save();
}
