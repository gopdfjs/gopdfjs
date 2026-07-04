import { readFileAsArrayBuffer } from "@gopdfjs/files";
import { pdfjs } from "@gopdfjs/render";

export async function extractImages(
  file: File
): Promise<{ blob: Blob; name: string; page: number }[]> {
  const bytes = await readFileAsArrayBuffer(file);
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(bytes.slice(0)) }).promise;
  const results: { blob: Blob; name: string; page: number }[] = [];

  const OPS = (pdfjs as unknown as { OPS: Record<string, number> }).OPS;

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const operatorList = await page.getOperatorList();
    
    for (let j = 0; j < operatorList.fnArray.length; j++) {
      const fn = operatorList.fnArray[j];
      const args = operatorList.argsArray[j];

      if (fn === OPS.paintImageXObject) {
        const objId = args[0];
        const img = await new Promise<{ data: Uint8ClampedArray; width: number; height: number } | null>(
          (resolve) => {
            (page.objs as unknown as { get: (id: string, cb: (data: { data: Uint8ClampedArray; width: number; height: number } | null) => void) => void }).get(objId, resolve);
          }
        );

        if (img && img.data) {
          const blob = await imageDataToBlob(img);
          results.push({ blob, name: `${objId}.png`, page: i });
        }
      } else if (fn === OPS.paintInlineImageXObject) {
        const img = args[0];
        if (img && img.data) {
          const blob = await imageDataToBlob(img);
          results.push({ blob, name: `inline_${i}_${j}.png`, page: i });
        }
      }
    }
  }
  return results;
}

async function imageDataToBlob(img: {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}): Promise<Blob> {
  const { data, width, height } = img;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  
  const imageData = ctx.createImageData(width, height);
  // Ensure we handle different pixel formats if necessary, but PDF.js usually returns RGBA for terminal objects
  imageData.data.set(data);
  ctx.putImageData(imageData, 0, 0);

  return new Promise<Blob>((res) =>
    canvas.toBlob((b) => res(b!), "image/png")
  );
}
