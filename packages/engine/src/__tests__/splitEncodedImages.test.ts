import { describe, expect, it } from "vitest";
import { splitEncodedImages } from "../splitEncodedImages";

function pack(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((n, c) => n + 4 + c.length, 0);
  const out = new Uint8Array(total);
  let i = 0;
  for (const chunk of chunks) {
    out[i++] = (chunk.length >> 24) & 0xff;
    out[i++] = (chunk.length >> 16) & 0xff;
    out[i++] = (chunk.length >> 8) & 0xff;
    out[i++] = chunk.length & 0xff;
    out.set(chunk, i);
    i += chunk.length;
  }
  return out;
}

describe("splitEncodedImages (engine-internal)", () => {
  it("splits one chunk", () => {
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

  it("returns empty for empty input", () => {
    expect(splitEncodedImages(new Uint8Array())).toEqual([]);
  });

  it("throws on truncated payload", () => {
    const bad = new Uint8Array([0, 0, 0, 5, 1]);
    expect(() => splitEncodedImages(bad)).toThrow(/invalid length-prefixed/);
  });
});
