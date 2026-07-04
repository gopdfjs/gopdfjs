import { describe, expect, it } from "vitest";
import { splitEncodedImages } from "./splitEncodedImages";

function pack(chunks: Uint8Array[]): Uint8Array {
  const parts: number[] = [];
  for (const chunk of chunks) {
    const len = chunk.length;
    parts.push(
      (len >>> 24) & 0xff,
      (len >>> 16) & 0xff,
      (len >>> 8) & 0xff,
      len & 0xff,
      ...chunk,
    );
  }
  return Uint8Array.from(parts);
}

describe("splitEncodedImages", () => {
  it("splits one length-prefixed chunk", () => {
    const chunk = new Uint8Array([1, 2, 3]);
    const out = splitEncodedImages(pack([chunk]));
    expect(out).toHaveLength(1);
    expect(out[0]).toEqual(chunk);
  });

  it("splits multiple chunks", () => {
    const a = new Uint8Array([10]);
    const b = new Uint8Array([20, 21]);
    const out = splitEncodedImages(pack([a, b]));
    expect(out).toEqual([a, b]);
  });

  it("returns empty array for empty input", () => {
    expect(splitEncodedImages(new Uint8Array())).toEqual([]);
  });

  it("rejects declared length past buffer end", () => {
    const bad = new Uint8Array([0, 0, 0, 9, 1, 2, 3]);
    expect(() => splitEncodedImages(bad)).toThrow(/invalid length-prefixed/);
  });
});
