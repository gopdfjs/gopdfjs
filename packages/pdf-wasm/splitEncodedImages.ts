/**
 * Split length-prefixed output from `encodeImages` into individual image buffers.
 * Pure helper — safe to unit test without loading the WASM Worker.
 */
export function splitEncodedImages(packed: Uint8Array): Uint8Array[] {
  const images: Uint8Array[] = [];
  let i = 0;
  while (i + 4 <= packed.length) {
    const len =
      (packed[i] << 24) |
      (packed[i + 1] << 16) |
      (packed[i + 2] << 8) |
      packed[i + 3];
    i += 4;
    images.push(packed.slice(i, i + len));
    i += len;
  }
  return images;
}
