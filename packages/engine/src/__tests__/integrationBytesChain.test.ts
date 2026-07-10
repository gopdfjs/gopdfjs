import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { PDF_FIXTURES } from "@gopdfjs/fixtures";
import { assertPdfBytesReadable } from "@gopdfjs/adapter/bytes";
import { createNodeGopdf } from "@gopdfjs/adapter-node";

const CHAIN_TIMEOUT_MS = 120_000;

describe("integration — same host buffer chain (adapter-node + WASM)", () => {
  it("loadDocument → grayscale → compress → linearize", async () => {
    const host = new Uint8Array(fs.readFileSync(PDF_FIXTURES.BMAUPIN_BASIC));
    const engine = await createNodeGopdf();

    const doc = await engine.loadDocument(host);
    expect(doc.numPages).toBeGreaterThan(0);
    assertPdfBytesReadable(host);

    const gray = await engine.grayscalePdf(host, { mode: "grayscale" });
    expect(gray.bytes.byteLength).toBeGreaterThan(0);
    assertPdfBytesReadable(host);

    const compressed = await engine.compressPdf(host, "low", () => undefined);
    expect(compressed.byteLength).toBeGreaterThan(0);
    assertPdfBytesReadable(host);

    const linear = await engine.linearizePdf(host);
    expect(linear.byteLength).toBeGreaterThan(0);
    assertPdfBytesReadable(host);

    const docAgain = await engine.loadDocument(host);
    expect(docAgain.numPages).toBe(doc.numPages);
    assertPdfBytesReadable(host);
  }, CHAIN_TIMEOUT_MS);
});
