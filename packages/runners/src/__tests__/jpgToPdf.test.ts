import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { jpgToPdf } from "../jpgToPdf";

// A tiny 1x1 black JPEG pixel
const mockJpegBase64 = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";

describe("jpgToPdf", () => {
  it("should convert a JPEG file to a single-page PDF", async () => {
    const binaryStr = atob(mockJpegBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const jpegFile = new File([bytes.buffer as ArrayBuffer], "image.jpg", { type: "image/jpeg" });

    const pdfBytes = await jpgToPdf([jpegFile]);
    const doc = await PDFDocument.load(pdfBytes);

    expect(doc.getPageCount()).toBe(1);
  });
});
