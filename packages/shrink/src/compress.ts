import { PDFDocument, PDFName, PDFRef, PDFDict, PDFContext } from "pdf-lib";
import { readFileAsArrayBuffer } from "@gopdfjs/files";
import { pdfjs } from "@gopdfjs/render";

export type CompressLevel = "low" | "med" | "high";

export async function compressPdf(
  file: File,
  level: CompressLevel,
  onProgress: (percent: number, step: string) => void
): Promise<Uint8Array> {
  onProgress(5, "Initializing PDF engines...");

  const bytes = await readFileAsArrayBuffer(file);
  
  onProgress(10, "Loading document structure...");
  // Load in pdfjs for rendering images - we must slice (clone) the array buffer since pdfjs transfers it to the web worker, detaching it!
  const pdfJsDoc = await pdfjs.getDocument({ data: new Uint8Array(bytes.slice(0)) }).promise;
  
  // Load in pdf-lib for mutating
  const pdfLibDoc = await PDFDocument.load(bytes, { updateMetadata: false });

  const numPages = pdfJsDoc.numPages;
  const OPS = (pdfjs as unknown as { OPS: Record<string, number> }).OPS;

  // Track replaced refs so we don't compress the same image twice (if used on multiple pages)
  const replacedRefs = new Set<string>();

  let imageCount = 0;

  // Configuration based on level
  const scaleFactor = level === "high" ? 0.3 : level === "med" ? 0.6 : 0.9;
  const jpegQuality = level === "high" ? 0.5 : level === "med" ? 0.7 : 0.9;

  for (let i = 1; i <= numPages; i++) {
    onProgress(10 + (i / numPages) * 20, `Analyzing page ${i}/${numPages}...`);
    
    const jsPage = await pdfJsDoc.getPage(i);
    const operatorList = await jsPage.getOperatorList();
    
    // Get corresponding pdf-lib page
    const libPage = pdfLibDoc.getPage(i - 1);
    const resources = libPage.node.Resources();
    if (!resources) continue;
    
    // Recursively gather all image references on this page (including those inside Form XObjects)
    const imageMap = getAllImageRefs(resources, pdfLibDoc.context);

    for (let j = 0; j < operatorList.fnArray.length; j++) {
      const fn = operatorList.fnArray[j];
      const args = operatorList.argsArray[j];

      if (fn === OPS.paintImageXObject) {
        const objId = args[0] as string; // resource name, could be prefixed by pdfjs e.g., 'g_d0_f1_Im1'
        
        // Find the PDFRef in our recursively built map using suffix matching
        let imageRef: PDFRef | null = null;
        let hasSMask = false;

        for (const [key, info] of Object.entries(imageMap)) {
           // pdfjs either uses the exact key or appends it to a form hierarchy string
           if (objId === key || objId.endsWith(`_${key}`)) {
               imageRef = info.ref;
               hasSMask = info.hasSMask;
               break;
           }
        }
        
        if (!imageRef) continue;
        
        // Skip images with Soft Masks (transparency) because converting them to JPEG will turn transparent areas black!
        if (hasSMask) continue;
        
        const refKey = `${imageRef.objectNumber}_${imageRef.generationNumber}`;
        if (replacedRefs.has(refKey)) continue; // Already processed
        
        replacedRefs.add(refKey);
        imageCount++;

        // Yield to allow UI update
        await new Promise((r) => setTimeout(r, 0));
        onProgress(30 + ((i / numPages) * 50), `Compressing image ${imageCount}...`);

        // Extract image data via pdfjs
        const imgParams = await new Promise<{ data: Uint8ClampedArray; width: number; height: number } | null>((resolve) => {
          (jsPage.objs as unknown as { get: (id: string, cb: (data: { data: Uint8ClampedArray; width: number; height: number } | null) => void) => void }).get(objId, resolve);
        });

        if (!imgParams || !imgParams.data) continue;

        // Downsample and convert to JPEG
        const compressedBytes = await downsampleImage(imgParams, scaleFactor, jpegQuality);

        // Embed the new JPEG in pdf-lib
        const newJpg = await pdfLibDoc.embedJpg(compressedBytes);

        // Swap the internal object reference!
        const newObj = pdfLibDoc.context.lookup(newJpg.ref);
        pdfLibDoc.context.assign(imageRef, newObj!);
      }
    }
  }

  onProgress(90, "Applying structural compression...");
  // Save with optimizations
  const savedBytes = await pdfLibDoc.save({ useObjectStreams: true, addDefaultPage: false });
  onProgress(100, "Compression complete.");
  
  return savedBytes;
}

function getAllImageRefs(resources: PDFDict, context: PDFContext, map: Record<string, {ref: PDFRef, hasSMask: boolean}> = {}): Record<string, {ref: PDFRef, hasSMask: boolean}> {
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

async function downsampleImage(img: { data: Uint8ClampedArray; width: number; height: number }, scaleFactor: number, quality: number): Promise<Uint8Array> {
  const { data, width, height } = img;
  
  // Use OffscreenCanvas if available, fallback to normal canvas
  let canvas: HTMLCanvasElement | OffscreenCanvas;
  let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  
  if (typeof OffscreenCanvas !== "undefined") {
    canvas = new OffscreenCanvas(width, height);
    ctx = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
  } else {
    canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  }

  // Draw original image pixels
  const imageData = ctx.createImageData(width, height);
  imageData.data.set(data);
  ctx.putImageData(imageData, 0, 0);

  // Resize canvas
  const newWidth = Math.max(1, Math.floor(width * scaleFactor));
  const newHeight = Math.max(1, Math.floor(height * scaleFactor));

  let resizedCanvas: HTMLCanvasElement | OffscreenCanvas;
  let resizedCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  
  if (typeof OffscreenCanvas !== "undefined") {
    resizedCanvas = new OffscreenCanvas(newWidth, newHeight);
    resizedCtx = resizedCanvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
  } else {
    resizedCanvas = document.createElement("canvas");
    resizedCanvas.width = newWidth;
    resizedCanvas.height = newHeight;
    resizedCtx = resizedCanvas.getContext("2d") as CanvasRenderingContext2D;
  }

  // Draw scaled
  resizedCtx.drawImage(
    canvas as unknown as HTMLCanvasElement, // Cast because signature differs slightly between HTMLCanvas and OffscreenCanvas
    0, 0, width, height,
    0, 0, newWidth, newHeight
  );

  // Export to JPEG
  if (typeof OffscreenCanvas !== "undefined") {
    const blob = await (resizedCanvas as OffscreenCanvas).convertToBlob({ type: "image/jpeg", quality });
    return new Uint8Array(await blob.arrayBuffer());
  } else {
    return new Promise<Uint8Array>((resolve) => {
      (resizedCanvas as HTMLCanvasElement).toBlob(
        (blob) => {
          blob!.arrayBuffer().then((buf) => resolve(new Uint8Array(buf)));
        },
        "image/jpeg",
        quality
      );
    });
  }
}
