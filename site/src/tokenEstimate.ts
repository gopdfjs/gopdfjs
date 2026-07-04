/**
 * Docs-site token comparison math (self-contained; mirrors `gopdf compare-tokens` heuristics).
 * multimodal: pages × 1600 · dump: pages × 800 × 1.3 · smart MCP: analyze + selective + optional image
 */

export const TOKENS_PER_PAGE_IMAGE = 1600;
export const WORDS_PER_PAGE = 800;
export const TOKENS_PER_WORD = 1.3;
export const DEFAULT_ANALYZE_TOKENS = 100;
export const TOKENS_PER_SELECTIVE_PAGE_TEXT = 600;
export const COST_USD_PER_MILLION_INPUT_TOKENS = 15;

export type CompareReadingMethodsInput = {
  pageCount: number;
  targetPages?: number;
  includeOneImage?: boolean;
  analyzeTokens?: number;
};

export type MethodEstimate = {
  tokens: number;
  estimatedCostUsd: number;
};

export type ComparisonResult = {
  methods: {
    multimodal: MethodEstimate;
    dumpAll: MethodEstimate;
    smartMcp: MethodEstimate;
  };
  savingsVsMultimodal: {
    smartMcpPercent: number;
  };
};

/** Convert token count to estimated USD input cost at $15/M tokens. */
export function estimateCostUsd(tokens: number): number {
  return (tokens / 1_000_000) * COST_USD_PER_MILLION_INPUT_TOKENS;
}

function savingsPercent(baseline: number, candidate: number): number {
  if (baseline <= 0) return 0;
  const saved = ((baseline - candidate) / baseline) * 100;
  return Math.max(0, Math.round(saved * 10) / 10);
}

/** Method A: every page sent as an image to a multimodal model. */
export function estimateMultimodalTokens(pageCount: number): number {
  return Math.max(0, pageCount) * TOKENS_PER_PAGE_IMAGE;
}

/** Method B: dump full-document text using page-count heuristic. */
export function estimateDumpAllTokens(pageCount: number): number {
  return Math.max(0, pageCount) * WORDS_PER_PAGE * TOKENS_PER_WORD;
}

/** Method C: analyze + selective page text + optional single page image (~2500 for 2 target pages). */
export function estimateSmartMcpTokens(opts: {
  targetPages: number;
  includeOneImage?: boolean;
  analyzeTokens?: number;
}): number {
  const analyze = opts.analyzeTokens ?? DEFAULT_ANALYZE_TOKENS;
  const selectiveTextTokens =
    Math.max(0, opts.targetPages) * TOKENS_PER_SELECTIVE_PAGE_TEXT;
  const imageTokens =
    opts.includeOneImage !== false ? TOKENS_PER_PAGE_IMAGE : 0;

  return Math.ceil(analyze + selectiveTextTokens + imageTokens);
}

/** Compare all three PDF reading strategies for the docs calculator. */
export function compareReadingMethods(
  input: CompareReadingMethodsInput,
): ComparisonResult {
  const targetPages = input.targetPages ?? 2;
  const includeOneImage = input.includeOneImage !== false;

  const multimodalTokens = estimateMultimodalTokens(input.pageCount);
  const dumpAllTokens = estimateDumpAllTokens(input.pageCount);
  const smartMcpTokens = estimateSmartMcpTokens({
    analyzeTokens: input.analyzeTokens,
    targetPages,
    includeOneImage,
  });

  return {
    methods: {
      multimodal: {
        tokens: multimodalTokens,
        estimatedCostUsd: estimateCostUsd(multimodalTokens),
      },
      dumpAll: {
        tokens: dumpAllTokens,
        estimatedCostUsd: estimateCostUsd(dumpAllTokens),
      },
      smartMcp: {
        tokens: smartMcpTokens,
        estimatedCostUsd: estimateCostUsd(smartMcpTokens),
      },
    },
    savingsVsMultimodal: {
      smartMcpPercent: savingsPercent(multimodalTokens, smartMcpTokens),
    },
  };
}
