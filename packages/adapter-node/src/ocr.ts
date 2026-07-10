import { createWorker } from "tesseract.js";
import type { OcrPort } from "@gopdfjs/adapter/ocr";

export async function createNodeOcrPort(): Promise<OcrPort> {
  return {
    async recognize(imageBytes, lang, onProgress) {
      const worker = await createWorker(lang, 1, {
        logger: (m) => {
          if (m.status === "recognizing text" && onProgress) {
            onProgress(m.progress);
          }
        },
      });

      try {
        const { data } = await worker.recognize(imageBytes);
        return data.text.trim();
      } finally {
        await worker.terminate();
      }
    },
  };
}
