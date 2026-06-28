import { describe, expect, it } from "vitest";
import { compressedPdfFilename } from "./downloadFilename";

describe("compressedPdfFilename", () => {
  it("strips pdf extension and adds suffix", () => {
    expect(compressedPdfFilename("report.PDF")).toBe("report-compressed.pdf");
  });

  it("uses default basename when name missing", () => {
    expect(compressedPdfFilename(null)).toBe("document-compressed.pdf");
  });
});
