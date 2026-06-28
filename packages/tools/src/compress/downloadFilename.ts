const DEFAULT_BASENAME = "document" as const;
const COMPRESSED_SUFFIX = "-compressed.pdf" as const;

/** 由源文件名生成压缩结果下载名（纯函数）。 */
export function compressedPdfFilename(sourceName: string | null): string {
  const base = sourceName?.replace(/\.pdf$/i, "") ?? DEFAULT_BASENAME;
  return `${base}${COMPRESSED_SUFFIX}`;
}
