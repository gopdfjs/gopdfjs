import { describe, it, expect } from "vitest";
import { applyNativeTextEdits, buildNativeTextEdit } from "../nativeTextEdit";
import { createMockPdf } from "./testUtils";

describe("applyNativeTextEdits", () => {
  it("returns modified PDF bytes when text is replaced", async () => {
    const original = await createMockPdf(1);

    const edit = buildNativeTextEdit(
      {
        pageIndex: 0,
        x: 50,
        y: 100,
        width: 80,
        height: 14,
        fontSize: 12,
      },
      "Edited page",
    );

    const output = await applyNativeTextEdits(original, [edit]);
    expect(output.byteLength).toBeGreaterThan(0);
    expect(output).not.toEqual(original);
  });

  it("supports multiline replacement text", async () => {
    const bytes = await createMockPdf(1);
    const edit = buildNativeTextEdit(
      {
        pageIndex: 0,
        x: 50,
        y: 100,
        width: 120,
        height: 30,
        fontSize: 12,
      },
      "Line A\nLine B",
    );

    const output = await applyNativeTextEdits(bytes, [edit]);
    expect(output.byteLength).toBeGreaterThan(0);
  });
});
