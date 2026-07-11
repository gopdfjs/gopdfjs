import type { CompressionLevel } from "@gopdfjs/engine";
import { useCallback, useEffect, useRef, useState } from "react";
import { downloadPdfBytes } from "../../lib/downloadBlob";
import { getBrowserEngine } from "../../lib/engine";
import { createPdfPreviewUrl, revokePreviewUrl } from "../../lib/pdfBlobPreview";
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
  beforePreviewUrl: string | null;
  afterPreviewUrl: string | null;
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
  const [beforePreviewUrl, setBeforePreviewUrl] = useState<string | null>(null);
  const [afterPreviewUrl, setAfterPreviewUrl] = useState<string | null>(null);
  const beforePreviewUrlRef = useRef<string | null>(null);
  const afterPreviewUrlRef = useRef<string | null>(null);

  const replaceBeforePreview = useCallback((bytes: Uint8Array | null) => {
    revokePreviewUrl(beforePreviewUrlRef.current);
    const next = bytes ? createPdfPreviewUrl(bytes) : null;
    beforePreviewUrlRef.current = next;
    setBeforePreviewUrl(next);
  }, []);

  const replaceAfterPreview = useCallback((bytes: Uint8Array | null) => {
    revokePreviewUrl(afterPreviewUrlRef.current);
    const next = bytes ? createPdfPreviewUrl(bytes) : null;
    afterPreviewUrlRef.current = next;
    setAfterPreviewUrl(next);
  }, []);

  useEffect(
    () => () => {
      revokePreviewUrl(beforePreviewUrlRef.current);
      revokePreviewUrl(afterPreviewUrlRef.current);
    },
    [],
  );

  const onPickFile = useCallback(async (file: File | null) => {
    setError(null);
    setStats(null);
    setOutputBytes(null);
    setProgress(0);
    replaceAfterPreview(null);
    if (!file) {
      setFileName(null);
      setInputBytes(null);
      replaceBeforePreview(null);
      return;
    }
    const buf = new Uint8Array(await file.arrayBuffer());
    setFileName(file.name);
    setInputBytes(buf);
    replaceBeforePreview(buf);
  }, [replaceAfterPreview, replaceBeforePreview]);

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
      replaceAfterPreview(output);
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      setError(formatCompressError(raw));
    } finally {
      setBusy(false);
    }
  }, [inputBytes, level, replaceAfterPreview]);

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
    beforePreviewUrl,
    afterPreviewUrl,
    canCompress: inputBytes != null && !busy,
    onPickFile,
    onLevelChange: setLevel,
    onCompress,
    onDownload,
  };
}
