import { describe, expect, it } from "vitest";
import {
  assertPdfBytesReadable,
  clonePdfBytes,
  detachArrayBuffer,
} from "../bytes";

describe("PDF byte ownership (RFC 0058 §2.4)", () => {
  it("clonePdfBytes survives detach of the copy", () => {
    const original = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
    const copy = clonePdfBytes(original);
    detachArrayBuffer(copy);
    assertPdfBytesReadable(original);
  });

  it("assertPdfBytesReadable throws on detached buffer", () => {
    const view = new Uint8Array([1, 2, 3]);
    detachArrayBuffer(view);
    expect(() => assertPdfBytesReadable(view)).toThrow(/detached/i);
    expect(() => assertPdfBytesReadable(view, "host pdf")).toThrow(/host pdf/);
  });

  it("host buffer stays readable after clone-and-detach pattern", () => {
    const host = new Uint8Array([37, 80, 68, 70]);
    const forPdfJs = clonePdfBytes(host);
    detachArrayBuffer(forPdfJs);
    expect(() => host.slice(0)).not.toThrow();
    assertPdfBytesReadable(host);
  });
});
