import { describe, expect, it } from "vitest";
import {
  CHARS_PER_TOKEN,
  compareReadingMethods,
  estimateCostUsd,
  estimateDumpAllTokens,
  estimateMultimodalTokens,
  estimateSmartMcpTokens,
  estimateTokensFromText,
  extractPageRangeFromPlainText,
  savingsPercent,
  TOKENS_PER_PAGE_IMAGE,
  TOKENS_PER_SELECTIVE_PAGE_TEXT,
  WORDS_PER_PAGE,
  TOKENS_PER_WORD,
  DEFAULT_ANALYZE_TOKENS,
} from "../tokenEstimate";

describe("estimateTokensFromText", () => {
  it("returns 0 for empty text", () => {
    expect(estimateTokensFromText("")).toBe(0);
    expect(estimateTokensFromText("   ")).toBe(0);
  });

  it("uses the higher of chars/4 and words×1.3", () => {
    const shortWords = "one two three four five";
    const fromWords = 5 * TOKENS_PER_WORD;
    const fromChars = shortWords.length / CHARS_PER_TOKEN;
    expect(estimateTokensFromText(shortWords)).toBe(
      Math.ceil(Math.max(fromWords, fromChars)),
    );
  });
});

describe("estimateMultimodalTokens", () => {
  it("scales linearly with page count", () => {
    expect(estimateMultimodalTokens(10)).toBe(10 * TOKENS_PER_PAGE_IMAGE);
    expect(estimateMultimodalTokens(0)).toBe(0);
  });
});

describe("estimateDumpAllTokens", () => {
  it("uses page-count heuristic without actual text", () => {
    expect(estimateDumpAllTokens(5)).toBe(5 * WORDS_PER_PAGE * TOKENS_PER_WORD);
  });

  it("uses actual text when provided", () => {
    const text = "hello world";
    expect(estimateDumpAllTokens(99, text)).toBe(estimateTokensFromText(text));
  });
});

describe("estimateSmartMcpTokens", () => {
  it("combines analyze, selective pages, and one image by default", () => {
    expect(
      estimateSmartMcpTokens({ targetPages: 2 }),
    ).toBe(
      DEFAULT_ANALYZE_TOKENS +
        2 * TOKENS_PER_SELECTIVE_PAGE_TEXT +
        TOKENS_PER_PAGE_IMAGE,
    );
  });

  it("uses sliced text when provided", () => {
    const sliced = "page one content here";
    expect(
      estimateSmartMcpTokens({ targetPages: 2, slicedText: sliced }),
    ).toBe(
      DEFAULT_ANALYZE_TOKENS +
        estimateTokensFromText(sliced) +
        TOKENS_PER_PAGE_IMAGE,
    );
  });

  it("omits image tokens when includeOneImage is false", () => {
    expect(
      estimateSmartMcpTokens({ targetPages: 1, includeOneImage: false }),
    ).toBe(DEFAULT_ANALYZE_TOKENS + TOKENS_PER_SELECTIVE_PAGE_TEXT);
  });
});

describe("compareReadingMethods", () => {
  it("returns all three methods with savings percentages", () => {
    const result = compareReadingMethods({ pageCount: 10, targetPages: 2 });

    expect(result.methods.multimodal.tokens).toBe(estimateMultimodalTokens(10));
    expect(result.methods.dumpAll.tokens).toBe(estimateDumpAllTokens(10));
    expect(result.methods.smartMcp.tokens).toBe(
      estimateSmartMcpTokens({ targetPages: 2 }),
    );
    expect(result.savingsVsMultimodal.smartMcpPercent).toBeGreaterThan(0);
    expect(result.savingsVsDumpAll.smartMcpPercent).toBeGreaterThan(0);
  });

  it("marks actual-text methods when fullText and slicedText are supplied", () => {
    const result = compareReadingMethods({
      pageCount: 3,
      fullText: "full document text",
      slicedText: "page slice",
      targetPages: 1,
    });

    expect(result.methods.dumpAll.usedActualText).toBe(true);
    expect(result.methods.smartMcp.usedActualText).toBe(true);
  });
});

describe("estimateCostUsd", () => {
  it("converts tokens to USD at $15/M input", () => {
    expect(estimateCostUsd(1_000_000)).toBe(15);
    expect(estimateCostUsd(10_000)).toBeCloseTo(0.15);
  });
});

describe("savingsPercent", () => {
  it("returns 0 when baseline is zero", () => {
    expect(savingsPercent(0, 100)).toBe(0);
  });

  it("never returns negative savings", () => {
    expect(savingsPercent(100, 200)).toBe(0);
  });
});

describe("extractPageRangeFromPlainText", () => {
  const sample = [
    "--- Page 1 ---",
    "First page line",
    "",
    "--- Page 2 ---",
    "Second page line",
    "",
    "--- Page 3 ---",
    "Third page line",
  ].join("\n");

  it("extracts inclusive page range", () => {
    const slice = extractPageRangeFromPlainText(sample, 1, 2);
    expect(slice).toContain("First page line");
    expect(slice).toContain("Second page line");
    expect(slice).not.toContain("Third page line");
  });

  it("returns empty string when range misses all pages", () => {
    expect(extractPageRangeFromPlainText(sample, 9, 10)).toBe("");
  });
});
