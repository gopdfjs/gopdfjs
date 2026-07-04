import { describe, it, expect } from "vitest";
import { repairPdfBatch, buildRepairedZip } from "../index";
import { createMockPdfBytes } from "./testUtils";

describe("repairPdfBatch", () => {
  it("repairs multiple PDFs and builds zip", async () => {
    const bytes1 = await createMockPdfBytes(1);
    const bytes2 = await createMockPdfBytes(2);
    const files = [
      new File([bytes1], "a.pdf", { type: "application/pdf" }),
      new File([bytes2], "b.pdf", { type: "application/pdf" }),
    ];

    const batch = await repairPdfBatch(files);
    expect(batch.successCount).toBe(2);
    expect(batch.items).toHaveLength(2);

    const zipBytes = await buildRepairedZip(batch.items);
    expect(zipBytes.byteLength).toBeGreaterThan(100);
  });
});
