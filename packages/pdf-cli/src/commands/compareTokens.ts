import fs from "node:fs";
import path from "node:path";
import {
  compareReadingMethods,
  extractPageRangeFromPlainText,
  pdfToText,
  TEXT_EXPORT_FORMAT,
  type ComparisonResult,
} from "@gopdfjs/extract";
import { analyzePdf } from "../analyze.ts";

const USAGE = `Usage: gopdf compare-tokens <input.pdf> [--target-pages 2] [--start 1] [--end N] [--json]

Options:
  --target-pages   Pages fetched in the smart MCP path (default: 2)
  --start          First page for actual sliced-text measurement (default: 1)
  --end            Last page for sliced-text measurement (default: target-pages)
  --json           Emit machine-readable JSON
  --no-image       Exclude the optional smart-path page image from estimates`;

export type CompareTokensOptions = {
  input: string;
  targetPages: number;
  startPage: number;
  endPage: number;
  json: boolean;
  includeOneImage: boolean;
};

export function parseCompareTokensArgv(
  argv: string[],
): CompareTokensOptions | null {
  let input: string | undefined;
  let targetPages = 2;
  let startPage = 1;
  let endPage: number | undefined;
  let json = false;
  let includeOneImage = true;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;

    if (arg === "--json") {
      json = true;
      continue;
    }
    if (arg === "--no-image") {
      includeOneImage = false;
      continue;
    }
    if (arg === "--target-pages") {
      const value = Number(argv[++i]);
      if (!Number.isFinite(value) || value < 1) {
        console.error("[ERROR] --target-pages must be a positive integer");
        return null;
      }
      targetPages = value;
      continue;
    }
    if (arg === "--start") {
      const value = Number(argv[++i]);
      if (!Number.isFinite(value) || value < 1) {
        console.error("[ERROR] --start must be a positive integer");
        return null;
      }
      startPage = value;
      continue;
    }
    if (arg === "--end") {
      const value = Number(argv[++i]);
      if (!Number.isFinite(value) || value < 1) {
        console.error("[ERROR] --end must be a positive integer");
        return null;
      }
      endPage = value;
      continue;
    }
    if (arg.startsWith("-")) {
      console.error(`Unknown option: ${arg}`);
      console.log(USAGE);
      return null;
    }
    if (!input) {
      input = arg;
    }
  }

  if (!input) {
    console.log(USAGE);
    return null;
  }

  if (!fs.existsSync(input)) {
    console.error(`[ERROR] File not found: ${input}`);
    return null;
  }

  const resolvedEnd = endPage ?? startPage + targetPages - 1;
  if (resolvedEnd < startPage) {
    console.error("[ERROR] --end must be >= --start");
    return null;
  }

  return {
    input,
    targetPages,
    startPage,
    endPage: resolvedEnd,
    json,
    includeOneImage,
  };
}

/** Format USD with four decimal places for small token costs. */
function formatUsd(amount: number): string {
  return `$${amount.toFixed(4)}`;
}

/** Format integer token counts with locale grouping. */
function formatTokens(tokens: number): string {
  return tokens.toLocaleString("en-US");
}

function methodNote(usedActualText: boolean): string {
  return usedActualText ? " (measured)" : " (estimated)";
}

/** Human-readable comparison table for terminal output. */
export function formatComparisonReport(
  fileName: string,
  comparison: ComparisonResult,
  sliceRange: { start: number; end: number },
): string {
  const { methods, savingsVsMultimodal, savingsVsDumpAll, pageCount, targetPages } =
    comparison;

  const rows = [
    ["Method", "Tokens", "Est. cost"],
    [
      `A. ${methods.multimodal.label}`,
      formatTokens(methods.multimodal.tokens),
      formatUsd(methods.multimodal.estimatedCostUsd),
    ],
    [
      `B. ${methods.dumpAll.label}${methodNote(methods.dumpAll.usedActualText)}`,
      formatTokens(methods.dumpAll.tokens),
      formatUsd(methods.dumpAll.estimatedCostUsd),
    ],
    [
      `C. ${methods.smartMcp.label}${methodNote(methods.smartMcp.usedActualText)}`,
      formatTokens(methods.smartMcp.tokens),
      formatUsd(methods.smartMcp.estimatedCostUsd),
    ],
  ];

  const colWidths = [0, 1, 2].map((col) =>
    Math.max(...rows.map((row) => row[col]!.length)),
  );

  const formattedRows = rows.map((row, index) => {
    const padded = row
      .map((cell, col) => cell.padEnd(colWidths[col]!))
      .join("  ");
    return index === 0 ? padded : `  ${padded}`;
  });

  return [
    "",
    "=== PDF Token Comparison ===",
    `File: ${fileName}`,
    `Pages: ${pageCount}`,
    `Smart path target pages: ${targetPages}`,
    `Measured slice: pages ${sliceRange.start}-${sliceRange.end}`,
    "",
    formattedRows[0],
    formattedRows.slice(1).join("\n"),
    "",
    "Savings vs multimodal (A):",
    `  Dump all (B): ${savingsVsMultimodal.dumpAllPercent}%`,
    `  Smart MCP (C): ${savingsVsMultimodal.smartMcpPercent}%`,
    "",
    "Savings vs dump all (B):",
    `  Smart MCP (C): ${savingsVsDumpAll.smartMcpPercent}%`,
    "",
    "Pricing assumption: $15 / 1M input tokens",
    "============================",
    "",
  ].join("\n");
}

export type CompareTokensPayload = ComparisonResult & {
  fileName: string;
  sliceRange: { start: number; end: number };
};

/** Core measurement pipeline shared by CLI and MCP. */
export async function measurePdfTokenComparison(
  inputPath: string,
  opts: Pick<
    CompareTokensOptions,
    "targetPages" | "startPage" | "endPage" | "includeOneImage"
  >,
): Promise<CompareTokensPayload> {
  const report = await analyzePdf(inputPath);
  const pdfBytes = new Uint8Array(fs.readFileSync(inputPath));

  let fullText: string | undefined;
  let slicedText: string | undefined;

  try {
    fullText = await pdfToText(pdfBytes, { format: TEXT_EXPORT_FORMAT.TXT });
    slicedText = extractPageRangeFromPlainText(
      fullText,
      opts.startPage,
      opts.endPage,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      `[WARN] Text extraction failed; using page-count heuristics only: ${message}`,
    );
  }

  const comparison = compareReadingMethods({
    pageCount: report.pageCount,
    fullText,
    targetPages: opts.targetPages,
    slicedText: slicedText || undefined,
    includeOneImage: opts.includeOneImage,
  });

  return {
    ...comparison,
    fileName: report.fileName,
    sliceRange: { start: opts.startPage, end: opts.endPage },
  };
}

export async function runCompareTokens(argv: string[]): Promise<number> {
  const opts = parseCompareTokensArgv(argv);
  if (!opts) {
    return 1;
  }

  const payload = await measurePdfTokenComparison(opts.input, opts);

  if (opts.json) {
    console.log(JSON.stringify(payload, null, 2));
    return 0;
  }

  console.log(
    formatComparisonReport(payload.fileName, payload, payload.sliceRange),
  );
  return 0;
}
