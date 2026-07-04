import fs from "node:fs";
import { describe, expect, it } from "vitest";
import {
  CLI_SMOKE_FIXTURES,
  COMPRESS_E2E_MATRIX,
  PDF_FIXTURES,
  PDF_FIXTURES_DIR,
} from "./index.ts";

describe("@gopdfjs/fixtures", () => {
  it("resolves pdf directory on disk", () => {
    expect(fs.existsSync(PDF_FIXTURES_DIR)).toBe(true);
  });

  it("exposes every pdf fixture file", () => {
    for (const file of Object.values(PDF_FIXTURES)) {
      expect(fs.existsSync(file), file).toBe(true);
    }
  });

  it("defines non-empty e2e and cli matrices", () => {
    expect(COMPRESS_E2E_MATRIX.length).toBeGreaterThan(0);
    expect(CLI_SMOKE_FIXTURES.length).toBeGreaterThan(0);
  });
});
