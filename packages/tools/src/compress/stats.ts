/** 压缩结果统计（纯函数，便于单测）。 */

export type CompressionStats = {
  inputBytes: number;
  outputBytes: number;
  /** 节省比例 0–1；输出更大时为 0 */
  savedRatio: number;
  /** 人类可读前后大小 */
  inputLabel: string;
  outputLabel: string;
};

const BYTE_UNITS = ["B", "KB", "MB", "GB"] as const;

/** 将字节数格式化为带单位的短标签 */
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

/** 计算节省比例；输出 ≥ 输入时返回 0 */
export function compressionSavedRatio(
  inputBytes: number,
  outputBytes: number,
): number {
  if (inputBytes <= 0 || outputBytes >= inputBytes) {
    return 0;
  }
  return (inputBytes - outputBytes) / inputBytes;
}

/** 由前后字节数生成展示用统计对象 */
export function buildCompressionStats(
  inputBytes: number,
  outputBytes: number,
): CompressionStats {
  return {
    inputBytes,
    outputBytes,
    savedRatio: compressionSavedRatio(inputBytes, outputBytes),
    inputLabel: formatFileSize(inputBytes),
    outputLabel: formatFileSize(outputBytes),
  };
}
