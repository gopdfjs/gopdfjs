const NO_REDUCTION_LABEL =
  "No reduction (already compact or no Flate streams)" as const;

/** 压缩节省比例的人类可读标签（纯函数）。 */
export function formatCompressionSavedLabel(savedRatio: number): string {
  return savedRatio > 0
    ? `${Math.round(savedRatio * 100)}%`
    : NO_REDUCTION_LABEL;
}
