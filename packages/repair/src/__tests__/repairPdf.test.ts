import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { repairPdf } from "../repairPdf";
import { REPAIR_STRATEGY } from "../constants";
import { createMockPdfBytes } from "./testUtils";

describe("repairPdf", () => {
  it("repairs a healthy PDF via pdf-lib rebuild", async () => {
    const bytes = await createMockPdfBytes(1);
    const file = new File([bytes], "test.pdf", { type: "application/pdf" });

    const result = await repairPdf(file);

    expect(result.report.strategy).toBe(REPAIR_STRATEGY.PDF_LIB_REBUILD);
    expect(result.report.validated).toBe(true);
    expect(result.report.outputPages).toBe(1);
    expect(result.report.scan.objectsFound).toBeGreaterThan(0);

    const doc = await PDFDocument.load(result.bytes);
    expect(doc.getPageCount()).toBe(1);
  });
});
