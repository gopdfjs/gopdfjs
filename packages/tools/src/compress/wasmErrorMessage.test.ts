import { describe, expect, it } from "vitest";
import { formatCompressWasmError } from "./wasmErrorMessage";

describe("formatCompressWasmError", () => {
  it("appends build hint for wasm load failures", () => {
    const out = formatCompressWasmError("Failed to fetch pdf_wasm_bg.wasm");
    expect(out).toContain("pnpm build:wasm");
  });

  it("passes through unrelated errors", () => {
    const msg = "deflate write error";
    expect(formatCompressWasmError(msg)).toBe(msg);
  });
});
