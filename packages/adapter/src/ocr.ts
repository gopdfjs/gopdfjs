/** OCR over rasterized page images (CLI / optional browser). */
export interface OcrPort {
  recognize(
    imageBytes: Uint8Array,
    lang: string,
    onProgress?: (fraction: number) => void,
  ): Promise<string>;
}

export type CreateOcrPort = () => Promise<OcrPort>;
