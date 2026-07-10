/** Tokens consumed when sending one rendered PDF page as an image to a multimodal model. */
export const TOKENS_PER_PAGE_IMAGE = 1600;

/** Average words per page when estimating full-document text dumps without extraction. */
export const WORDS_PER_PAGE = 800;

/** Average tokens per word for English-like prose. */
export const TOKENS_PER_WORD = 1.3;

/** Fallback chars-per-token ratio (≈ GPT-style heuristic). */
export const CHARS_PER_TOKEN = 4;

/** Tokens for the initial analyze/summary step in the smart MCP path. */
export const DEFAULT_ANALYZE_TOKENS = 100;

/** Estimated tokens per selectively fetched text page in the smart MCP path. */
export const TOKENS_PER_SELECTIVE_PAGE_TEXT = 600;

/** Input token price used for cost estimates ($/million tokens). */
export const COST_USD_PER_MILLION_INPUT_TOKENS = 15;

export const READING_METHOD = {
  MULTIMODAL: "multimodal",
  DUMP_ALL: "dump-all",
  SMART_MCP: "smart-mcp",
} as const;

export type ReadingMethodId =
  (typeof READING_METHOD)[keyof typeof READING_METHOD];

export type MethodEstimate = {
  id: ReadingMethodId;
  label: string;
  tokens: number;
  estimatedCostUsd: number;
  usedActualText: boolean;
};

export type ComparisonResult = {
  pageCount: number;
  targetPages: number;
  methods: {
    multimodal: MethodEstimate;
    dumpAll: MethodEstimate;
    smartMcp: MethodEstimate;
  };
  savingsVsMultimodal: {
    dumpAllPercent: number;
    smartMcpPercent: number;
  };
  savingsVsDumpAll: {
    smartMcpPercent: number;
  };
};

export type CompareReadingMethodsInput = {
  pageCount: number;
  fullText?: string;
  targetPages?: number;
  /** Actual extracted text for the selective page slice (smart MCP path). */
  slicedText?: string;
  includeOneImage?: boolean;
  analyzeTokens?: number;
};

const PAGE_HEADER_PATTERN = /^--- Page (\d+) ---$/;

/** Count whitespace-delimited words in a string. */
function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/** Convert token count to estimated USD input cost. */
export function estimateCostUsd(tokens: number): number {
  return (tokens / 1_000_000) * COST_USD_PER_MILLION_INPUT_TOKENS;
}

/** Percent saved when `candidate` uses fewer tokens than `baseline`. */
export function savingsPercent(baseline: number, candidate: number): number {
  if (baseline <= 0) return 0;
  const saved = ((baseline - candidate) / baseline) * 100;
  return Math.max(0, Math.round(saved * 10) / 10);
}

/**
 * Estimate tokens from raw text using the higher of chars/4 and words×1.3.
 */
export function estimateTokensFromText(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;

  const fromChars = trimmed.length / CHARS_PER_TOKEN;
  const fromWords = countWords(trimmed) * TOKENS_PER_WORD;
  return Math.ceil(Math.max(fromChars, fromWords));
}

/** Method A: send every page as an image to a multimodal model. */
export function estimateMultimodalTokens(pageCount: number): number {
  return Math.max(0, pageCount) * TOKENS_PER_PAGE_IMAGE;
}

/**
 * Method B: dump all extracted text (or page-count heuristic when text is absent).
 */
export function estimateDumpAllTokens(
  pageCount: number,
  actualText?: string,
): number {
  if (actualText !== undefined) {
    return estimateTokensFromText(actualText);
  }
  return Math.max(0, pageCount) * WORDS_PER_PAGE * TOKENS_PER_WORD;
}

export type SmartMcpEstimateOptions = {
  analyzeTokens?: number;
  targetPages: number;
  includeOneImage?: boolean;
  /** When provided, replaces the selective-page heuristic with measured text. */
  slicedText?: string;
};

/** Method C: analyze + selective page text + optional single page image. */
export function estimateSmartMcpTokens(opts: SmartMcpEstimateOptions): number {
  const analyze = opts.analyzeTokens ?? DEFAULT_ANALYZE_TOKENS;
  const selectiveTextTokens =
    opts.slicedText !== undefined
      ? estimateTokensFromText(opts.slicedText)
      : Math.max(0, opts.targetPages) * TOKENS_PER_SELECTIVE_PAGE_TEXT;
  const imageTokens =
    opts.includeOneImage !== false ? TOKENS_PER_PAGE_IMAGE : 0;

  return Math.ceil(analyze + selectiveTextTokens + imageTokens);
}

/** Build a labeled method estimate row. */
function buildMethodEstimate(
  id: ReadingMethodId,
  label: string,
  tokens: number,
  usedActualText: boolean,
): MethodEstimate {
  return {
    id,
    label,
    tokens,
    estimatedCostUsd: estimateCostUsd(tokens),
    usedActualText,
  };
}

/** Compare all three PDF reading strategies for the same document. */
export function compareReadingMethods(
  input: CompareReadingMethodsInput,
): ComparisonResult {
  const targetPages = input.targetPages ?? 2;
  const includeOneImage = input.includeOneImage !== false;

  const multimodalTokens = estimateMultimodalTokens(input.pageCount);
  const dumpAllTokens = estimateDumpAllTokens(input.pageCount, input.fullText);
  const smartMcpTokens = estimateSmartMcpTokens({
    analyzeTokens: input.analyzeTokens,
    targetPages,
    includeOneImage,
    slicedText: input.slicedText,
  });

  const multimodal = buildMethodEstimate(
    READING_METHOD.MULTIMODAL,
    "Multimodal (all pages as images)",
    multimodalTokens,
    false,
  );
  const dumpAll = buildMethodEstimate(
    READING_METHOD.DUMP_ALL,
    "Dump all text",
    dumpAllTokens,
    input.fullText !== undefined,
  );
  const smartMcp = buildMethodEstimate(
    READING_METHOD.SMART_MCP,
    "Smart MCP (analyze + selective pages)",
    smartMcpTokens,
    input.slicedText !== undefined,
  );

  return {
    pageCount: input.pageCount,
    targetPages,
    methods: { multimodal, dumpAll, smartMcp },
    savingsVsMultimodal: {
      dumpAllPercent: savingsPercent(multimodalTokens, dumpAllTokens),
      smartMcpPercent: savingsPercent(multimodalTokens, smartMcpTokens),
    },
    savingsVsDumpAll: {
      smartMcpPercent: savingsPercent(dumpAllTokens, smartMcpTokens),
    },
  };
}

/**
 * Extract plain-text body for pages in `[startPage, endPage]` from pdfToText output.
 */
export function extractPageRangeFromPlainText(
  plainText: string,
  startPage: number,
  endPage: number,
): string {
  const blocks: string[] = [];
  let currentPage = 0;
  let currentLines: string[] = [];

  const flush = () => {
    if (
      currentPage >= startPage &&
      currentPage <= endPage &&
      currentLines.some((line) => line.trim())
    ) {
      blocks.push(currentLines.join("\n").trim());
    }
  };

  for (const line of plainText.split("\n")) {
    const match = PAGE_HEADER_PATTERN.exec(line.trim());
    if (match) {
      flush();
      currentPage = Number(match[1]);
      currentLines = [];
      continue;
    }

    if (currentPage >= startPage && currentPage <= endPage) {
      currentLines.push(line);
    }
  }

  flush();
  return blocks.join("\n\n").trim();
}
