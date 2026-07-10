import type { Annotation } from "./edit";

/** Display pixels per PDF point — must match edit page canvas scale. */
export const DISPLAY_SCALE = 1.5;

export type PdfPageInfo = { width: number; height: number };

export type SerializedFabricObject = {
    annotationType?: string;
    type?: string;
    left?: number;
    top?: number;
    width?: number;
    height?: number;
    scaleX?: number;
    scaleY?: number;
    angle?: number;
    fontSize?: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    text?: string;
    rx?: number;
    ry?: number;
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
    src?: string;
};

export const FABRIC_SERIALIZE_FIELDS = ["id", "annotationType", "src"] as const;

async function dataUrlToFile(dataUrl: string, fileName: string): Promise<File> {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], fileName, { type: blob.type || "image/png" });
}

/** Map serialized Fabric objects (per page) to pdf-lib annotations. */
export async function fabricObjectsToAnnotations(
    pageObjects: Record<number, SerializedFabricObject[]>,
    pageInfos: PdfPageInfo[],
    options?: { displayScale?: number; createId?: () => string },
): Promise<Annotation[]> {
    const displayScale = options?.displayScale ?? DISPLAY_SCALE;
    const createId = options?.createId ?? (() => Math.random().toString(36).slice(2, 10));
    const allAnnotations: Annotation[] = [];

    for (const [pageIdxStr, objects] of Object.entries(pageObjects)) {
        const pageIdx = Number(pageIdxStr);
        const pi = pageInfos[pageIdx];
        if (!pi) continue;

        const cw = pi.width * displayScale;
        const ch = pi.height * displayScale;

        for (const raw of objects) {
            const type = (raw.annotationType || raw.type || "") as string;
            const left = raw.left ?? 0;
            const top = raw.top ?? 0;
            const w = (raw.width ?? 0) * (raw.scaleX ?? 1);
            const h = (raw.height ?? 0) * (raw.scaleY ?? 1);
            const pdfX = (left / cw) * pi.width;
            const pdfY = pi.height - ((top + h) / ch) * pi.height;

            if (type === "rect") {
                allAnnotations.push({
                    id: createId(),
                    type: "rect",
                    pageIndex: pageIdx,
                    x: pdfX,
                    y: pdfY,
                    width: (w / cw) * pi.width,
                    height: (h / ch) * pi.height,
                    color: raw.stroke ?? "#000000",
                });
            } else if (type === "ellipse") {
                const rx = (raw.rx ?? 50) * (raw.scaleX ?? 1);
                const ry = (raw.ry ?? 30) * (raw.scaleY ?? 1);
                allAnnotations.push({
                    id: createId(),
                    type: "ellipse",
                    pageIndex: pageIdx,
                    x: pdfX,
                    y: pdfY,
                    width: (rx * 2 / cw) * pi.width,
                    height: (ry * 2 / ch) * pi.height,
                    color: raw.stroke ?? "#000000",
                });
            } else if (type === "line") {
                const x1 = (raw.x1 ?? 0) + left;
                const y1 = (raw.y1 ?? 0) + top;
                const x2 = (raw.x2 ?? 0) + left;
                const y2 = (raw.y2 ?? 0) + top;
                allAnnotations.push({
                    id: createId(),
                    type: "line",
                    pageIndex: pageIdx,
                    x: (x1 / cw) * pi.width,
                    y: pi.height - (y1 / ch) * pi.height,
                    width: ((x2 - x1) / cw) * pi.width,
                    height: -((y2 - y1) / ch) * pi.height,
                    color: raw.stroke ?? "#000000",
                    strokeWidth: raw.strokeWidth,
                });
            } else if (type === "text" || type === "i-text") {
                const textPdfY = pi.height - (top / ch) * pi.height;
                const size = (raw.fontSize ?? 16) / displayScale;
                allAnnotations.push({
                    id: createId(),
                    type: "text",
                    pageIndex: pageIdx,
                    x: pdfX,
                    y: textPdfY,
                    text: raw.text ?? "",
                    fontSize: size,
                    color: raw.fill ?? "#000000",
                });
            } else if (type === "image" && raw.src) {
                const imageFile = await dataUrlToFile(raw.src, `stamp-${createId()}.png`);
                allAnnotations.push({
                    id: createId(),
                    type: "image",
                    pageIndex: pageIdx,
                    x: pdfX,
                    y: pdfY,
                    width: (w / cw) * pi.width,
                    height: (h / ch) * pi.height,
                    color: "#000000",
                    image: imageFile,
                    fontSize: 100,
                });
            }
        }
    }

    return allAnnotations;
}
