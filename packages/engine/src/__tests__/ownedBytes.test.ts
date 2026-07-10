import { describe, expect, it } from "vitest";
import { assertPdfBytesReadable, detachArrayBuffer } from "@gopdfjs/adapter/bytes";
import { ownPdfBytes, ownPdfBytesList } from "../ownedBytes";

describe("ownPdfBytes", () => {
  it("returns independent copy", () => {
    const host = new Uint8Array([1, 2, 3]);
    const owned = ownPdfBytes(host);
    expect(owned).not.toBe(host);
    expect(owned).toEqual(host);
  });

  it("survives detach of owned copy", () => {
    const host = new Uint8Array([1, 2, 3]);
    const owned = ownPdfBytes(host);
    detachArrayBuffer(owned);
    assertPdfBytesReadable(host);
  });

  it("ownPdfBytesList clones each input", () => {
    const a = new Uint8Array([1]);
    const b = new Uint8Array([2]);
    const [copyA, copyB] = ownPdfBytesList([a, b]);
    expect(copyA).not.toBe(a);
    expect(copyB).not.toBe(b);
    detachArrayBuffer(copyA);
    detachArrayBuffer(copyB);
    assertPdfBytesReadable(a);
    assertPdfBytesReadable(b);
  });
});
