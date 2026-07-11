import { describe, expect, it } from "vitest";
import { createPdfPreviewUrl, revokePreviewUrl } from "./pdfBlobPreview";

describe("createPdfPreviewUrl", () => {
  it("returns blob URL for non-empty PDF bytes", () => {
    const url = createPdfPreviewUrl(new Uint8Array([37, 80, 68, 70]));
    expect(url).toMatch(/^blob:/);
    revokePreviewUrl(url);
  });

  it("returns null for empty bytes", () => {
    expect(createPdfPreviewUrl(new Uint8Array())).toBeNull();
  });
});
