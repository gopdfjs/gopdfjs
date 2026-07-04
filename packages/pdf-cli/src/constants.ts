export const BIN_NAME = "gopdf" as const;

export const COMPRESSION_LEVELS = ["low", "recommended", "extreme"] as const;

export type CompressionLevel = (typeof COMPRESSION_LEVELS)[number];

export function isCompressionLevel(value: string): value is CompressionLevel {
  return (COMPRESSION_LEVELS as readonly string[]).includes(value);
}
