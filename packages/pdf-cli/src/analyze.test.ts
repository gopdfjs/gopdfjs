import { describe, expect, it } from "vitest";
import { CLI_SMOKE_FIXTURES } from "@gopdfjs/fixtures";
import { analyzePdf } from "./analyze.ts";

describe("gopdf analyze (shared fixtures)", () => {
  for (const { id, file } of CLI_SMOKE_FIXTURES) {
    it(`loads ${id}`, async () => {
      const report = await analyzePdf(file);
      expect(report.pageCount).toBeGreaterThan(0);
      expect(report.sizeBytes).toBeGreaterThan(0);
    });
  }

  it("rejects missing file", async () => {
    await expect(analyzePdf("/no/such/file.pdf")).rejects.toThrow(/not found/i);
  });
});
