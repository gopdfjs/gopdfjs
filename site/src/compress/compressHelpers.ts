/** Demo-local compress UX helpers (product L2 lives in ilovepdf). */

export type CompressionStats = {
  inputBytes: number;
  outputBytes: number;
  savedRatio: number;
  inputLabel: string;
  outputLabel: string;
};

const BYTE_UNITS = ["B", "KB", "MB", "GB"] as const;
const DEFAULT_BASENAME = "document" as const;
const COMPRESSED_SUFFIX = "-compressed.pdf" as const;
const NO_REDUCTION_LABEL =
  "No reduction (already compact or no Flate streams)" as const;
const WASM_BUILD_HINT = "run pnpm build:wasm from repo root." as const;
const WASM_LOAD_MARKERS = ["Failed to fetch", "pkg/", "gopdf_wasm"] as const;

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "0 B";
  }
  if (bytes === 0) {
    return "0 B";
  }
  const idx = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    BYTE_UNITS.length - 1,
  );
  const value = bytes / 1024 ** idx;
  const digits = value >= 100 || idx === 0 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(digits)} ${BYTE_UNITS[idx]}`;
}

export function buildCompressionStats(
  inputBytes: number,
  outputBytes: number,
): CompressionStats {
  const savedRatio =
    inputBytes <= 0 || outputBytes >= inputBytes
      ? 0
      : (inputBytes - outputBytes) / inputBytes;
  return {
    inputBytes,
    outputBytes,
    savedRatio,
    inputLabel: formatFileSize(inputBytes),
    outputLabel: formatFileSize(outputBytes),
  };
}

export function formatCompressionSavedLabel(savedRatio: number): string {
  return savedRatio > 0
    ? `${Math.round(savedRatio * 100)}%`
    : NO_REDUCTION_LABEL;
}

export function compressedPdfFilename(sourceName: string | null): string {
  const base = sourceName?.replace(/\.pdf$/i, "") ?? DEFAULT_BASENAME;
  return `${base}${COMPRESSED_SUFFIX}`;
}

export function formatCompressWasmError(raw: string): string {
  const needsHint = WASM_LOAD_MARKERS.some((marker) => raw.includes(marker));
  return needsHint ? `${raw} — ${WASM_BUILD_HINT}` : raw;
}
