import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { repairPdf } from "../repairPdf";
import { REPAIR_STRATEGY } from "../constants";
import { createMockRuntime } from "./mockRuntime";
import { createMockPdfBytes } from "./testUtils";

/** Simulate pdf.js transferring (detaching) the buffer passed to loadDocument. */
function detachArrayBuffer(view: Uint8Array): void {
  const { port1, port2 } = new MessageChannel();
  port1.postMessage(view, [view.buffer]);
  port2.onmessage = () => undefined;
}

describe("repairPdf", () => {
  it("repairs a healthy PDF via pdf-lib rebuild", async () => {
    const bytes = await createMockPdfBytes(1);
    const runtime = createMockRuntime(bytes);

    const result = await repairPdf(bytes, runtime);

    expect(result.report.strategy).toBe(REPAIR_STRATEGY.PDF_LIB_REBUILD);
    expect(result.report.validated).toBe(true);
    expect(result.report.outputPages).toBe(1);
    expect(result.report.scan.objectsFound).toBeGreaterThan(0);

    const doc = await PDFDocument.load(result.bytes);
    expect(doc.getPageCount()).toBe(1);
  });

  it("returns readable bytes after pdf.js detaches the validation buffer", async () => {
    const bytes = await createMockPdfBytes(1);
    const runtime = createMockRuntime(bytes);
    runtime.loadDocument = async (input: Uint8Array) => {
      detachArrayBuffer(input);
      return {
        numPages: 1,
        getPage: async () => ({
          getViewport: ({ scale }: { scale: number }) => ({
            width: 200 * scale,
            height: 200 * scale,
          }),
          render: () => ({ promise: Promise.resolve() }),
          getTextContent: async () => ({ items: [] }),
        }),
      };
    };

    const result = await repairPdf(bytes, runtime);

    expect(result.report.validated).toBe(true);
    expect(() => result.bytes.slice(0, 4)).not.toThrow();
    expect(result.bytes.byteLength).toBeGreaterThan(0);
    expect(result.report.strategy).toBe(REPAIR_STRATEGY.PDF_LIB_REBUILD);
  });
});
