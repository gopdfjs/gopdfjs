import {
  compressPdf,
  type CompressionLevel,
} from "@gopdfjs/pdf-wasm";
import { buildCompressionStats, type CompressionStats } from "./stats";

export type CompressProgress = {
  fraction: number;
  percent: number;
};

export type CompressResult = {
  bytes: Uint8Array;
  stats: CompressionStats;
};

/**
 * 浏览器内压缩 PDF（RFC 0008 Phase 1）。
 * 委托 @gopdfjs/pdf-wasm Worker；调用方勿复用传入的 input 缓冲区。
 */
export async function runCompressPdf(
  input: Uint8Array,
  level: CompressionLevel,
  onProgress?: (progress: CompressProgress) => void,
): Promise<CompressResult> {
  const inputBytes = input.byteLength;
  const out = await compressPdf(input, level, (fraction) => {
    onProgress?.({
      fraction,
      percent: Math.round(fraction * 100),
    });
  });
  return {
    bytes: out,
    stats: buildCompressionStats(inputBytes, out.byteLength),
  };
}
