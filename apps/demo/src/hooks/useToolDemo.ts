import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DemoKind } from "../config/demoKind";
import { demoKindFor } from "../config/demoKind";
import type { ToolDef } from "../config/tools";
import type { DemoContext, DemoImageInput } from "../lib/demoContext";
import { downloadPdfBytes } from "../lib/downloadBlob";
import { createPdfPreviewUrl, revokePreviewUrl } from "../lib/pdfBlobPreview";
import {
  buildDemoPreviews,
  revokeDemoPreviews,
  type DemoPreviewState,
} from "../lib/demoPreviewUrls";
import { getBrowserEngine } from "../lib/engine";
import {
  defaultAuthorSource,
  runToolDemo,
  type ToolRunResult,
} from "../lib/toolRunners";

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp" as const;
const DEMO_PASSWORD_DEFAULT = "gopdf-demo";

export type ToolDemoState = {
  demoKind: DemoKind;
  fileName: string | null;
  fileNames: string[];
  imageNames: string[];
  stampFileName: string | null;
  password: string;
  textSource: string;
  busy: boolean;
  error: string | null;
  result: ToolRunResult | null;
  previews: DemoPreviewState;
  canRun: boolean;
};

export type ToolDemoActions = {
  onPickPdf: (file: File | null) => Promise<void>;
  onPickPdfs: (files: File[]) => Promise<void>;
  onClearPdfs: () => void;
  onPickImages: (files: File[]) => Promise<void>;
  onClearImages: () => void;
  onPickStamp: (file: File | null) => Promise<void>;
  onPasswordChange: (value: string) => void;
  onTextChange: (value: string) => void;
  onRun: () => Promise<void>;
  onDownload: () => void;
};

function mimeFromFile(file: File): string {
  if (file.type) return file.type;
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

async function fileToImageInput(file: File): Promise<DemoImageInput> {
  return {
    bytes: new Uint8Array(await file.arrayBuffer()),
    mimeType: mimeFromFile(file),
    name: file.name,
  };
}

export function useToolDemo(tool: ToolDef): ToolDemoState & ToolDemoActions {
  const demoKind = useMemo(() => demoKindFor(tool.id), [tool.id]);

  const [fileName, setFileName] = useState<string | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [pdfList, setPdfList] = useState<{ name: string; bytes: Uint8Array }[]>([]);
  const [images, setImages] = useState<DemoImageInput[]>([]);
  const [stampFileName, setStampFileName] = useState<string | null>(null);
  const [stampBytes, setStampBytes] = useState<Uint8Array | undefined>();
  const [password, setPassword] = useState(DEMO_PASSWORD_DEFAULT);
  const [textSource, setTextSource] = useState(() => defaultAuthorSource(tool.id));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ToolRunResult | null>(null);
  const [previews, setPreviews] = useState<DemoPreviewState>(() => ({
    inputPdfUrl: null,
    outputPdfUrl: null,
    jpegThumbs: [],
    imageThumbs: [],
  }));

  const previewsRef = useRef(previews);
  previewsRef.current = previews;

  useEffect(
    () => () => {
      revokeDemoPreviews(previewsRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!pdfBytes?.byteLength) return;
    setPreviews((prev) => {
      revokePreviewUrl(prev.inputPdfUrl);
      return { ...prev, inputPdfUrl: createPdfPreviewUrl(pdfBytes) };
    });
  }, [pdfBytes]);

  const resetResult = useCallback(() => {
    setError(null);
    setResult(null);
    setPreviews((prev) => {
      revokePreviewUrl(prev.outputPdfUrl);
      for (const item of prev.jpegThumbs) revokePreviewUrl(item.url);
      for (const item of prev.imageThumbs) revokePreviewUrl(item.url);
      return {
        ...prev,
        outputPdfUrl: null,
        jpegThumbs: [],
        imageThumbs: [],
      };
    });
  }, []);

  const onPickPdf = useCallback(
    async (file: File | null) => {
      resetResult();
      if (!file) {
        setFileName(null);
        setPdfBytes(null);
        return;
      }
      setFileName(file.name);
      setPdfBytes(new Uint8Array(await file.arrayBuffer()));
    },
    [resetResult],
  );

  const onPickPdfs = useCallback(
    async (files: File[]) => {
      resetResult();
      const next = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          bytes: new Uint8Array(await file.arrayBuffer()),
        })),
      );
      setPdfList((prev) => [...prev, ...next]);
    },
    [resetResult],
  );

  const onClearPdfs = useCallback(() => {
    resetResult();
    setPdfList([]);
  }, [resetResult]);

  const onPickImages = useCallback(
    async (files: File[]) => {
      resetResult();
      const next = await Promise.all(files.map(fileToImageInput));
      setImages((prev) => [...prev, ...next]);
    },
    [resetResult],
  );

  const onClearImages = useCallback(() => {
    resetResult();
    setImages([]);
  }, [resetResult]);

  const onPickStamp = useCallback(
    async (file: File | null) => {
      resetResult();
      if (!file) {
        setStampFileName(null);
        setStampBytes(undefined);
        return;
      }
      setStampFileName(file.name);
      setStampBytes(new Uint8Array(await file.arrayBuffer()));
    },
    [resetResult],
  );

  const buildContext = useCallback((): DemoContext => {
    switch (demoKind) {
      case "merge":
        return { pdfBytesList: pdfList.map((item) => item.bytes) };
      case "jpg-to-pdf":
        return { images };
      case "sign-pdf":
        return { pdfBytes: pdfBytes ?? undefined, stampBytes };
      case "password-pdf":
        return { pdfBytes: pdfBytes ?? undefined, password };
      case "html-to-pdf":
      case "markdown-to-html":
        return { textSource };
      default:
        return { pdfBytes: pdfBytes ?? undefined };
    }
  }, [demoKind, images, password, pdfBytes, pdfList, stampBytes, textSource]);

  const canRun = useMemo(() => {
    if (busy) return false;
    switch (demoKind) {
      case "merge":
        return pdfList.length >= 2;
      case "jpg-to-pdf":
        return images.length > 0;
      case "html-to-pdf":
      case "markdown-to-html":
        return textSource.trim().length > 0;
      default:
        return pdfBytes != null;
    }
  }, [busy, demoKind, images.length, pdfBytes, pdfList.length, textSource]);

  const onRun = useCallback(async () => {
    setBusy(true);
    resetResult();
    try {
      const engine = await getBrowserEngine();
      const next = await runToolDemo(engine, tool.id, buildContext());
      setResult(next);
      setPreviews((prev) => {
        revokePreviewUrl(prev.outputPdfUrl);
        for (const item of prev.jpegThumbs) revokePreviewUrl(item.url);
        for (const item of prev.imageThumbs) revokePreviewUrl(item.url);
        return buildDemoPreviews(pdfBytes, next);
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [buildContext, pdfBytes, resetResult, tool.id]);

  const onDownload = useCallback(() => {
    if (!result) return;
    if (result.kind === "pdf") {
      const base =
        fileName?.replace(/\.pdf$/i, "") ??
        (demoKind === "jpg-to-pdf" ? "images" : "output");
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
  }, [demoKind, fileName, result, tool.id]);

  return {
    demoKind,
    fileName,
    fileNames: pdfList.map((item) => item.name),
    imageNames: images.map((item) => item.name),
    stampFileName,
    password,
    textSource,
    busy,
    error,
    result,
    previews,
    canRun,
    onPickPdf,
    onPickPdfs,
    onClearPdfs,
    onPickImages,
    onClearImages,
    onPickStamp,
    onPasswordChange: setPassword,
    onTextChange: setTextSource,
    onRun,
    onDownload,
  };
}

export { IMAGE_ACCEPT, DEMO_PASSWORD_DEFAULT };
