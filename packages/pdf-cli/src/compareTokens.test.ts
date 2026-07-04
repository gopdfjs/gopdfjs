import { describe, expect, it } from "vitest";
import { CLI_SMOKE_FIXTURES, PDF_FIXTURES } from "@gopdfjs/fixtures";
import {
  formatComparisonReport,
  measurePdfTokenComparison,
  parseCompareTokensArgv,
} from "./commands/compareTokens.ts";
import { compareReadingMethods } from "@gopdfjs/extract";

describe("parseCompareTokensArgv", () => {
  it("parses defaults", () => {
    const opts = parseCompareTokensArgv([PDF_FIXTURES.BMAUPIN_BASIC]);
    expect(opts).toMatchObject({
      input: PDF_FIXTURES.BMAUPIN_BASIC,
      targetPages: 2,
      startPage: 1,
      endPage: 2,
      json: false,
      includeOneImage: true,
    });
  });

  it("parses custom page slice and json flag", () => {
    const fixture = CLI_SMOKE_FIXTURES[0]!.file;
    const opts = parseCompareTokensArgv([
      fixture,
      "--target-pages",
      "3",
      "--start",
      "2",
      "--end",
      "4",
      "--json",
      "--no-image",
    ]);
    expect(opts).toMatchObject({
      input: fixture,
      targetPages: 3,
      startPage: 2,
      endPage: 4,
      json: true,
      includeOneImage: false,
    });
  });
});

describe("formatComparisonReport", () => {
  it("includes method rows and savings", () => {
    const comparison = compareReadingMethods({ pageCount: 10, targetPages: 2 });
    const report = formatComparisonReport("doc.pdf", comparison, {
      start: 1,
      end: 2,
    });

    expect(report).toContain("PDF Token Comparison");
    expect(report).toContain("Multimodal");
    expect(report).toContain("Smart MCP");
    expect(report).toContain("Savings vs multimodal");
  });
});

describe("measurePdfTokenComparison", () => {
  it("measures a multi-page fixture (text extraction or heuristic fallback)", async () => {
    const payload = await measurePdfTokenComparison(PDF_FIXTURES.PY_PDF_4_PAGES, {
      targetPages: 1,
      startPage: 1,
      endPage: 1,
      includeOneImage: true,
    });

    expect(payload.pageCount).toBeGreaterThan(1);
    expect(payload.methods.multimodal.tokens).toBeGreaterThan(
      payload.methods.smartMcp.tokens,
    );
    expect(payload.savingsVsMultimodal.smartMcpPercent).toBeGreaterThan(0);
  });
});
