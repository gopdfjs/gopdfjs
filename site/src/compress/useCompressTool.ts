import { compressPdf, type CompressionLevel } from "@gopdfjs/engine";
import {
  buildCompressionStats,
  compressedPdfFilename,
  formatCompressWasmError,
  type CompressionStats,
} from "./compressHelpers";
import { useCallback, useState } from "react";
import { downloadPdfBytes } from "../downloadBlob";

export const COMPRESS_LEVELS: CompressionLevel[] = [
  "low",
  "recommended",
  "extreme",
];

export const PDF_ACCEPT = "application/pdf" as const;

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
      const inputSize = inputBytes.byteLength;
      const bytes = await compressPdf(inputBytes, level, (fraction) => {
        setProgress(Math.round(fraction * 100));
      });
      setOutputBytes(bytes);
      setStats(buildCompressionStats(inputSize, bytes.byteLength));
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      setError(formatCompressWasmError(raw));
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
