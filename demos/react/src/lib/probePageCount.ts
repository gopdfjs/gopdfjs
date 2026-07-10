import { getBrowserEngine } from "./engine";

/** Page count via consumer-facing `engine.analyzePdf`. */
export async function probePageCount(bytes: Uint8Array): Promise<number> {
  const engine = await getBrowserEngine();
  const analysis = await engine.analyzePdf(bytes);
  return analysis.pages;
}
