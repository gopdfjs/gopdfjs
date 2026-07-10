import fs from "node:fs";
import { describe, it } from "vitest";
import { PDF_FIXTURES } from "@gopdfjs/fixtures";
import { assertPdfBytesReadable } from "@gopdfjs/adapter/bytes";
import { createNodeGopdf } from "@gopdfjs/adapter-node";

describe("compressPdf byte ownership", () => {
  it("does not detach caller buffer via engine facade", async () => {
    const host = new Uint8Array(fs.readFileSync(PDF_FIXTURES.BMAUPIN_BASIC));
    const engine = await createNodeGopdf();

    await engine.compressPdf(host, "low");

    assertPdfBytesReadable(host);
  }, 90_000);
});
