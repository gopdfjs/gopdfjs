import { PDFDocument, PDFName, PDFRef, PDFDict, PDFContext } from "pdf-lib";
import type { GopdfRuntime } from "@gopdfjs/runtime";

export type CompressLevel = "low" | "med" | "high";

type PdfJsImagePage = {
  getOperatorList(): Promise<{ fnArray: number[]; argsArray: unknown[] }>;
  objs: {
    get: (
      id: string,
      cb: (data: { data: Uint8ClampedArray; width: number; height: number } | null) => void,
    ) => void;
  };
};

export async function compressPdf(
  bytes: Uint8Array,
  runtime: GopdfRuntime,
  level: CompressLevel,
  onProgress: (percent: number, step: string) => void,
): Promise<Uint8Array> {
  onProgress(5, "Initializing PDF engines...");

  onProgress(10, "Loading document structure...");
  // pdf-lib copies bytes; pdf.js may detach — load pdf-lib first on the same owned buffer.
  const pdfLibDoc = await PDFDocument.load(bytes, { updateMetadata: false });
  const pdfJsDoc = await runtime.loadDocument(bytes);

  const numPages = pdfJsDoc.numPages;
  const OPS = await runtime.getPdfOps();

  const replacedRefs = new Set<string>();
  let imageCount = 0;

  const scaleFactor = level === "high" ? 0.3 : level === "med" ? 0.6 : 0.9;
  const jpegQuality = level === "high" ? 0.5 : level === "med" ? 0.7 : 0.9;

  for (let i = 1; i <= numPages; i++) {
    onProgress(10 + (i / numPages) * 20, `Analyzing page ${i}/${numPages}...`);

    const jsPage = (await pdfJsDoc.getPage(i)) as unknown as PdfJsImagePage;
    const operatorList = await jsPage.getOperatorList();

    const libPage = pdfLibDoc.getPage(i - 1);
    const resources = libPage.node.Resources();
    if (!resources) continue;

    const imageMap = getAllImageRefs(resources, pdfLibDoc.context);

    for (let j = 0; j < operatorList.fnArray.length; j++) {
      const fn = operatorList.fnArray[j];
      const args = operatorList.argsArray[j];

      if (fn === OPS.paintImageXObject) {
        const objId = args[0] as string;

        let imageRef: PDFRef | null = null;
        let hasSMask = false;

        for (const [key, info] of Object.entries(imageMap)) {
          if (objId === key || objId.endsWith(`_${key}`)) {
            imageRef = info.ref;
            hasSMask = info.hasSMask;
            break;
          }
        }

        if (!imageRef || hasSMask) continue;

        const refKey = `${imageRef.objectNumber}_${imageRef.generationNumber}`;
        if (replacedRefs.has(refKey)) continue;

        replacedRefs.add(refKey);
        imageCount++;

        await new Promise((r) => setTimeout(r, 0));
        onProgress(30 + (i / numPages) * 50, `Compressing image ${imageCount}...`);

        const imgParams = await new Promise<{
          data: Uint8ClampedArray;
          width: number;
          height: number;
        } | null>((resolve) => {
          jsPage.objs.get(objId, resolve);
        });

        if (!imgParams?.data) continue;

        const compressedBytes = await downsampleImage(
          imgParams,
          runtime,
          scaleFactor,
          jpegQuality,
        );

        const newJpg = await pdfLibDoc.embedJpg(compressedBytes);
        const newObj = pdfLibDoc.context.lookup(newJpg.ref);
        pdfLibDoc.context.assign(imageRef, newObj!);
      }
    }
  }

  onProgress(90, "Applying structural compression...");
  const savedBytes = await pdfLibDoc.save({ useObjectStreams: true, addDefaultPage: false });
  onProgress(100, "Compression complete.");

  return savedBytes;
}

function getAllImageRefs(
  resources: PDFDict,
  context: PDFContext,
  map: Record<string, { ref: PDFRef; hasSMask: boolean }> = {},
): Record<string, { ref: PDFRef; hasSMask: boolean }> {
  const xobjects = resources.get(PDFName.of("XObject"));
  if (xobjects && xobjects instanceof PDFDict) {
    for (const [key, val] of xobjects.entries()) {
      if (!(val instanceof PDFRef)) continue;
      const obj = context.lookup(val);
      if (!obj || !(obj as unknown as { dict: PDFDict }).dict) continue;

      const subtype = (obj as unknown as { dict: PDFDict }).dict.get(PDFName.of("Subtype"));
      if (subtype === PDFName.of("Image")) {
        const smask = (obj as unknown as { dict: PDFDict }).dict.get(PDFName.of("SMask"));
        map[key.decodeText()] = { ref: val, hasSMask: !!smask };
      } else if (subtype === PDFName.of("Form")) {
        const formResources = (obj as unknown as { dict: PDFDict }).dict.get(PDFName.of("Resources"));
        if (formResources && formResources instanceof PDFDict) {
          getAllImageRefs(formResources, context, map);
        }
      }
    }
  }
  return map;
}

async function downsampleImage(
  img: { data: Uint8ClampedArray; width: number; height: number },
  runtime: GopdfRuntime,
  scaleFactor: number,
  quality: number,
): Promise<Uint8Array> {
  const { data, width, height } = img;
  const surface = await runtime.createCanvas(width, height);
  const ctx = surface.getContext2d();
  const imageData = ctx.createImageData(width, height);
  imageData.data.set(data);
  ctx.putImageData(imageData, 0, 0);

  const newWidth = Math.max(1, Math.floor(width * scaleFactor));
  const newHeight = Math.max(1, Math.floor(height * scaleFactor));
  const resized = await runtime.createCanvas(newWidth, newHeight);
  const resizedCtx = resized.getContext2d();
  const src = surface.getRenderTarget?.();
  if (!src) {
    throw new Error("Canvas adapter must expose getRenderTarget for image downsample");
  }
  resizedCtx.drawImage(src as CanvasImageSource, 0, 0, width, height, 0, 0, newWidth, newHeight);

  try {
    return await resized.toImageBytes("jpeg", quality);
  } finally {
    await surface.dispose();
    await resized.dispose();
  }
}
