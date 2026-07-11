import { useCallback, useMemo, useState } from "react";
import type { ToolDef } from "../config/tools";
import { downloadPdfBytes } from "../lib/downloadBlob";
import { getBrowserEngine } from "../lib/engine";
import {
  defaultAuthorSource,
  runAuthorTool,
  runBrowserTool,
  toolInputKind,
  type ToolRunResult,
} from "../lib/toolRunners";

export type GenericToolState = {
  fileName: string | null;
  textSource: string;
  busy: boolean;
  error: string | null;
  result: ToolRunResult | null;
  canRun: boolean;
  inputKind: ReturnType<typeof toolInputKind>;
};

export type GenericToolActions = {
  onPickFile: (file: File | null) => Promise<void>;
  onTextChange: (value: string) => void;
  onRun: () => Promise<void>;
  onDownload: () => void;
};

export function useGenericTool(tool: ToolDef): GenericToolState & GenericToolActions {
  const inputKind = useMemo(() => toolInputKind(tool.id), [tool.id]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [textSource, setTextSource] = useState(() => defaultAuthorSource(tool.id));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ToolRunResult | null>(null);

  const onPickFile = useCallback(async (file: File | null) => {
    setError(null);
    setResult(null);
    if (!file) {
      setFileName(null);
      setPdfBytes(null);
      return;
    }
    setFileName(file.name);
    setPdfBytes(new Uint8Array(await file.arrayBuffer()));
  }, []);

  const onRun = useCallback(async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const engine = await getBrowserEngine();
      let next: ToolRunResult;
      if (inputKind === "pdf") {
        if (!pdfBytes) return;
        next = await runBrowserTool(engine, tool.id, pdfBytes);
      } else if (tool.id === "html-to-pdf" || tool.id === "markdown-to-html") {
        next = await runAuthorTool(engine, tool.id, textSource);
      } else {
        throw new Error(`Unsupported author tool ${tool.id}`);
      }
      setResult(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [inputKind, pdfBytes, textSource, tool.id]);

  const onDownload = useCallback(() => {
    if (!result) return;
    if (result.kind === "pdf") {
      const base = fileName?.replace(/\.pdf$/i, "") ?? "output";
      downloadPdfBytes(result.bytes, `${base}-${tool.id}.pdf`);
      return;
    }
    if (result.kind === "blob") {
      const url = URL.createObjectURL(result.blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = result.filename;
      anchor.click();
      URL.revokeObjectURL(url);
    }
  }, [fileName, result, tool.id]);

  const canRun =
    !busy &&
    (inputKind === "pdf" ? pdfBytes != null : textSource.trim().length > 0);

  return {
    fileName,
    textSource,
    busy,
    error,
    result,
    canRun,
    inputKind,
    onPickFile,
    onTextChange: setTextSource,
    onRun,
    onDownload,
  };
}
