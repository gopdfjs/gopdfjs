import type { CompressionLevel } from "@gopdfjs/adapter";
import { useCallback, useState } from "react";
import { downloadPdfBytes } from "../../lib/downloadBlob";
import { getBrowserEngine } from "../../lib/engine";
import {
  buildCompressionStats,
  compressedPdfFilename,
  formatCompressionSavedLabel,
  formatCompressError,
  type CompressionStats,
} from "./compressStats";

export const COMPRESS_LEVELS: CompressionLevel[] = ["low", "recommended", "extreme"];

export type { CompressionStats };
export { formatCompressionSavedLabel };

export type CompressToolState = {
  fileName: string | null;
  level: CompressionLevel;
  busy: boolean;
  progress: number;
  error: string | null;
  stats: CompressionStats | null;
  canCompress: boolean;
};

export type CompressToolActions = {
  onPickFile: (file: File | null) => Promise<void>;
  onLevelChange: (level: CompressionLevel) => void;
  onCompress: () => Promise<void>;
  onDownload: () => void;
};

export function useCompressTool(): CompressToolState & CompressToolActions {
  const [fileName, setFileName] = useState<string | null>(null);
  const [inputBytes, setInputBytes] = useState<Uint8Array | null>(null);
  const [level, setLevel] = useState<CompressionLevel>("recommended");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<CompressionStats | null>(null);
  const [outputBytes, setOutputBytes] = useState<Uint8Array | null>(null);

  const onPickFile = useCallback(async (file: File | null) => {
    setError(null);
    setStats(null);
    setOutputBytes(null);
    setProgress(0);
    if (!file) {
      setFileName(null);
      setInputBytes(null);
      return;
    }
    const buf = new Uint8Array(await file.arrayBuffer());
    setFileName(file.name);
    setInputBytes(buf);
  }, []);

  const onCompress = useCallback(async () => {
    if (!inputBytes) {
      return;
    }
    setBusy(true);
    setError(null);
    setProgress(0);
    try {
      const engine = await getBrowserEngine();
      const output = await engine.compressPdf(inputBytes, level, (fraction) => {
        setProgress(Math.round(fraction * 100));
      });
      setOutputBytes(output);
      setStats(buildCompressionStats(inputBytes.byteLength, output.byteLength));
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      setError(formatCompressError(raw));
    } finally {
      setBusy(false);
    }
  }, [inputBytes, level]);

  const onDownload = useCallback(() => {
    if (!outputBytes) {
      return;
    }
    downloadPdfBytes(outputBytes, compressedPdfFilename(fileName));
  }, [fileName, outputBytes]);

  return {
    fileName,
    level,
    busy,
    progress,
    error,
    stats,
    canCompress: inputBytes != null && !busy,
    onPickFile,
    onLevelChange: setLevel,
    onCompress,
    onDownload,
  };
}
