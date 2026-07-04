import { createWorker } from "tesseract.js";
import { pdfjs } from "@gopdfjs/render";
import { createCanvas } from "@napi-rs/canvas";

/** Runs OCR in Node.js on a PDF file using tesseract.js and napi-rs canvas. */
export async function ocrPdf(
  pdfBytes: Uint8Array,
  lang = "eng",
  onProgress: (p: number) => void = () => {}
): Promise<string> {
  const pdf = await pdfjs.getDocument({ data: pdfBytes }).promise;
  const numPages = pdf.numPages;
  let fullText = "";

  const worker = await createWorker(lang, 1, {
    logger: (m) => {
      if (m.status === "recognizing text") onProgress(m.progress);
    },
  });

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = createCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport }).promise;

    // Convert @napi-rs/canvas to standard image buffer so tesseract.js can consume it directly
    const buffer = await canvas.toBuffer("image/png");
    
    const {
      data: { text },
    } = await worker.recognize(buffer);
    fullText += text + "\n\n";
    onProgress(i / numPages);
  }

  await worker.terminate();
  return fullText.trim();
}
