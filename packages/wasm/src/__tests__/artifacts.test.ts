import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const PKG_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../pkg");

describe("@gopdfjs/wasm artifacts (single web build)", () => {
  it("ships web-target glue", () => {
    expect(fs.existsSync(path.join(PKG_DIR, "gopdf_wasm.js"))).toBe(true);
  });

  it("ships the shared wasm binary", () => {
    expect(fs.existsSync(path.join(PKG_DIR, "gopdf_wasm_bg.wasm"))).toBe(true);
  });
});
