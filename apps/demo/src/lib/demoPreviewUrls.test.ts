import { describe, expect, it } from "vitest";
import { buildDemoPreviews, revokeDemoPreviews } from "./demoPreviewUrls";

describe("demoPreviewUrls", () => {
  it("creates pdf preview urls for input and pdf output", () => {
    const input = new Uint8Array([37, 80, 68, 70, 45]);
    const output = new Uint8Array([37, 80, 68, 70, 49]);
    const previews = buildDemoPreviews(input, {
      kind: "pdf",
      bytes: output,
      summary: "ok",
    });
    expect(previews.inputPdfUrl).toMatch(/^blob:/);
    expect(previews.outputPdfUrl).toMatch(/^blob:/);
    revokeDemoPreviews(previews);
  });

  it("creates jpeg thumbs for pdf-to-jpeg results", () => {
    const jpeg = new Uint8Array([255, 216, 255]);
    const previews = buildDemoPreviews(null, {
      kind: "jpeg-pages",
      pages: [{ bytes: jpeg, page: 1 }],
      summary: "1 page",
    });
    expect(previews.jpegThumbs).toHaveLength(1);
    revokeDemoPreviews(previews);
  });
});
