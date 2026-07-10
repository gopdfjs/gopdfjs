import { describe, it, expect } from "vitest";
import { repairPdfBatch, buildRepairedZip } from "../index";
import { createMockRuntime } from "./mockRuntime";
import { createMockPdfBytes } from "./testUtils";

describe("repairPdfBatch", () => {
  it("repairs multiple PDFs and builds zip", async () => {
    const bytes1 = await createMockPdfBytes(1);
    const bytes2 = await createMockPdfBytes(2);
    const runtime = createMockRuntime(bytes1);
    const inputs = [
      { fileName: "a.pdf", bytes: bytes1 },
      { fileName: "b.pdf", bytes: bytes2 },
    ];

    const batch = await repairPdfBatch(inputs, runtime);
    expect(batch.successCount).toBe(2);
    expect(batch.items).toHaveLength(2);

    const zipBytes = await buildRepairedZip(batch.items);
    expect(zipBytes.byteLength).toBeGreaterThan(100);
  });
});
