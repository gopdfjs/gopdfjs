import type { GopdfRuntime } from "@gopdfjs/runtime";

type ImageData = { data: Uint8ClampedArray; width: number; height: number };

export async function extractImages(
  bytes: Uint8Array,
  runtime: GopdfRuntime,
): Promise<{ blob: Blob; name: string; page: number }[]> {
  const pdf = await runtime.loadDocument(bytes);
  const OPS = await runtime.getPdfOps();
  const results: { blob: Blob; name: string; page: number }[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const operatorList = await (page as unknown as {
      getOperatorList: () => Promise<{ fnArray: number[]; argsArray: unknown[][] }>;
    }).getOperatorList();

    for (let j = 0; j < operatorList.fnArray.length; j++) {
      const fn = operatorList.fnArray[j];
      const args = operatorList.argsArray[j];

      if (fn === OPS.paintImageXObject) {
        const objId = args[0] as string;
        const img = await new Promise<ImageData | null>((resolve) => {
          (
            page as unknown as {
              objs: { get: (id: string, cb: (data: ImageData | null) => void) => void };
            }
          ).objs.get(objId, resolve);
        });

        if (img?.data) {
          const blob = await imageDataToBlob(runtime, img);
          results.push({ blob, name: `${objId}.png`, page: i });
        }
      } else if (fn === OPS.paintInlineImageXObject) {
        const img = args[0] as ImageData;
        if (img?.data) {
          const blob = await imageDataToBlob(runtime, img);
          results.push({ blob, name: `inline_${i}_${j}.png`, page: i });
        }
      }
    }
  }

  return results;
}

async function imageDataToBlob(runtime: GopdfRuntime, img: ImageData): Promise<Blob> {
  const surface = await runtime.createCanvas(img.width, img.height);
  const ctx = surface.getContext2d();
  ctx.putImageData(new ImageData(img.data, img.width, img.height), 0, 0);
  const bytes = await surface.toImageBytes("png");
  await surface.dispose();
  return new Blob([bytes], { type: "image/png" });
}
