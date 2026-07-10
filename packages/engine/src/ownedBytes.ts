import { clonePdfBytes } from "@gopdfjs/adapter/bytes";

/** Engine facade entry — host buffer must survive multiple tool calls on the same reference. */
export function ownPdfBytes(bytes: Uint8Array): Uint8Array {
  return clonePdfBytes(bytes);
}

export function ownPdfBytesList(inputs: readonly Uint8Array[]): Uint8Array[] {
  return inputs.map(ownPdfBytes);
}
