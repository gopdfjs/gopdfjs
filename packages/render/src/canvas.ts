import { createCanvas as napiCreateCanvas } from "@napi-rs/canvas";

/**
 * Creates a new canvas instance for Node-native rendering.
 * @param width - The width of the canvas in pixels.
 * @param height - The height of the canvas in pixels.
 */
export function createCanvas(width: number, height: number): any {
  // Use @napi-rs/canvas's createCanvas to generate the native canvas instance
  return napiCreateCanvas(width, height);
}

/**
 * Converts a canvas element to a Uint8Array byte buffer.
 * @param canvas - The canvas instance to convert.
 * @param format - The target image MIME type format.
 * @param quality - The compression quality (0.0 to 1.0) for JPEGs.
 */
export async function canvasToBytes(
  canvas: any,
  format: "image/jpeg" | "image/png" = "image/jpeg",
  quality = 0.85
): Promise<Uint8Array> {
  // Match image/jpeg with quality mapping, otherwise output png
  if (format === "image/jpeg") {
    // Map quality 0.0-1.0 to 0-100 for napi-rs/canvas
    const q = Math.round(quality * 100);
    const buffer = await canvas.toBuffer("image/jpeg", q);
    return new Uint8Array(buffer);
  } else {
    const buffer = await canvas.toBuffer("image/png");
    return new Uint8Array(buffer);
  }
}
