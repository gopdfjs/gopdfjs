export type CompressionStats = {
  inputLabel: string;
  outputLabel: string;
  inputBytes: number;
  outputBytes: number;
  savedRatio: number;
};

const BYTES_LABEL = "bytes" as const;

/** Build before/after stats for the compress UI. */
export function buildCompressionStats(inputBytes: number, outputBytes: number): CompressionStats {
  const savedRatio =
    inputBytes > 0 ? Math.max(0, (inputBytes - outputBytes) / inputBytes) : 0;
  return {
    inputLabel: BYTES_LABEL,
    outputLabel: BYTES_LABEL,
    inputBytes,
    outputBytes,
    savedRatio,
  };
}

export function formatCompressionSavedLabel(ratio: number): string {
  const pct = Math.round(ratio * 100);
  return pct > 0 ? `${pct}% smaller` : "No size reduction";
}

export function compressedPdfFilename(sourceName: string | null): string {
  const base = sourceName?.replace(/\.pdf$/i, "") ?? "document";
  return `${base}-compressed.pdf`;
}

export function formatCompressError(raw: string): string {
  if (raw.includes("Failed to fetch") || raw.includes("pkg/") || raw.includes("pdf_wasm")) {
    return `${raw} — run \`pnpm build:wasm\` from the repo root.`;
  }
  return raw;
}
