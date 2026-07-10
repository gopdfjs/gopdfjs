import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { PDF_FIXTURES } from "@gopdfjs/fixtures";
import { assertPdfBytesReadable, clonePdfBytes } from "@gopdfjs/adapter/bytes";
import { createBrowserPdfJsRuntime } from "../pdfjs";

// pdfjs-dist browser build needs a real browser worker; Node/happy-dom fails with
// hashOriginal.toHex. Byte ownership: @gopdfjs/engine integration + browser e2e.
const skipInVitestNode = typeof process !== "undefined" && process.env.VITEST === "true";

describe.skipIf(skipInVitestNode)("adapter-browser pdf.js port", () => {
  it("loadDocument consumes engine-owned bytes without touching host buffer", async () => {
    const host = new Uint8Array(fs.readFileSync(PDF_FIXTURES.BMAUPIN_BASIC));
    const pdfjs = await createBrowserPdfJsRuntime();
    // Engine facade clones before calling adapter; simulate that contract here.
    const owned = clonePdfBytes(host);

    const docA = await pdfjs.loadDocument(owned);
    expect(docA.numPages).toBeGreaterThan(0);
    assertPdfBytesReadable(host);

    const ownedB = clonePdfBytes(host);
    const docB = await pdfjs.loadDocument(ownedB);
    expect(docB.numPages).toBe(docA.numPages);
    assertPdfBytesReadable(host);
  }, 60_000);
});
