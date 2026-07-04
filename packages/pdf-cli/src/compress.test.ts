import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { PDF_FIXTURES } from "@gopdfjs/fixtures";
import { parseCompressArgv, runCompress } from "./commands/compress.ts";

const WASM_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../engine/pkg/gopdf_wasm_bg.wasm",
);
const wasmBuilt = fs.existsSync(WASM_PATH);

describe("gopdf compress", () => {
  const tmpDir = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    ".tmp-compress-test",
  );

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("parses argv", () => {
    const opts = parseCompressArgv([
      PDF_FIXTURES.PY_PDF_LIBRE_WRITER,
      "-o",
      "/tmp/out.pdf",
      "--level",
      "low",
    ]);
    expect(opts?.level).toBe("low");
    expect(opts?.output).toBe("/tmp/out.pdf");
  });

  it.skipIf(!wasmBuilt)("compresses shared fixture", async () => {
    fs.mkdirSync(tmpDir, { recursive: true });
    const out = path.join(tmpDir, "out.pdf");
    const code = await runCompress([
      PDF_FIXTURES.FLATE_SAMPLE,
      "-o",
      out,
      "--level",
      "recommended",
    ]);
    expect(code).toBe(0);
    expect(fs.existsSync(out)).toBe(true);
    expect(fs.statSync(out).size).toBeGreaterThan(0);
  });
});
