"use client";
import { useEffect, useRef } from "react";

interface Props {
  pdfBytes: Uint8Array;
  pageIndex: number;
  width?: number;
}

export default function PageThumbnail({ pdfBytes, pageIndex, width = 150 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { pdfjs } = await import("@/lib/pdfWorker");
      const pdf = await pdfjs.getDocument({ data: pdfBytes }).promise;
      const page = await pdf.getPage(pageIndex + 1);
      const viewport = page.getViewport({ scale: width / page.getViewport({ scale: 1 }).width });
      const canvas = canvasRef.current;
      if (!canvas || cancelled) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;
      await page.render({ canvasContext: ctx, viewport, canvas: canvas as any }).promise;
    })();
    return () => { cancelled = true; };
  }, [pdfBytes, pageIndex, width]);

  return <canvas ref={canvasRef} style={{ width, display: "block" }} />;
}
