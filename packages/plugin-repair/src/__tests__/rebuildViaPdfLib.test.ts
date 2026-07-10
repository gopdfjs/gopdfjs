import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { rebuildViaPdfLib } from "../rebuildViaPdfLib";
import { createMockPdfBytes } from "./testUtils";

describe("rebuildViaPdfLib", () => {
  it("rebuilds a valid PDF with the same page count", async () => {
    const bytes = await createMockPdfBytes(2);
    const { bytes: rebuilt, pageCount } = await rebuildViaPdfLib(bytes);

    expect(pageCount).toBe(2);
    const doc = await PDFDocument.load(rebuilt);
    expect(doc.getPageCount()).toBe(2);
  });
});
