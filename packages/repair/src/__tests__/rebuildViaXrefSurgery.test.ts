import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { rebuildViaXrefSurgery } from "../rebuildViaXrefSurgery";
import { rebuildViaPdfLib } from "../rebuildViaPdfLib";
import { createMockPdfBytes, corruptStartxref } from "./testUtils";

describe("rebuildViaXrefSurgery", () => {
  it("rebuilds xref for PDF with corrupted startxref", async () => {
    const bytes = await createMockPdfBytes(1);
    const broken = corruptStartxref(bytes);
    const fixed = rebuildViaXrefSurgery(broken);
    const { pageCount } = await rebuildViaPdfLib(fixed);
    expect(pageCount).toBe(1);

    const doc = await PDFDocument.load(fixed);
    expect(doc.getPageCount()).toBe(1);
  });
});
