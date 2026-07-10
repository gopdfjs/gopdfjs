import { describe, it, expect } from "vitest";
import { scanPdfObjects } from "../scanPdfObjects";
import { createMockPdfBytes } from "./testUtils";

describe("scanPdfObjects", () => {
  it("counts obj/endobj markers in a valid mock PDF", async () => {
    const bytes = await createMockPdfBytes(1);
    const scan = scanPdfObjects(bytes);

    expect(scan.objectsFound).toBeGreaterThan(0);
    expect(scan.objectsWithEndobj).toBeGreaterThan(0);
    expect(scan.orphanObjects).toBeGreaterThanOrEqual(0);
    expect(scan.hasStartxref).toBe(true);
    expect(scan.fileSizeBytes).toBe(bytes.byteLength);
  });

  it("detects missing startxref after corruption helper", async () => {
    const bytes = await createMockPdfBytes(1);
    let text = "";
    for (let i = 0; i < bytes.length; i++) {
      text += String.fromCharCode(bytes[i]!);
    }
    const broken = text.replace("startxref", "broken_marker");
    const brokenBytes = new Uint8Array(broken.length);
    for (let i = 0; i < broken.length; i++) {
      brokenBytes[i] = broken.charCodeAt(i);
    }

    const scan = scanPdfObjects(brokenBytes);
    expect(scan.hasStartxref).toBe(false);
    expect(scan.objectsFound).toBeGreaterThan(0);
  });
});
