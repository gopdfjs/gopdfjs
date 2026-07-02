/**
 * Read configured locales from packages/i18n/src/locales.ts.
 */
import fs from "node:fs";

/**
 * @param {string} localesTsPath
 * @returns {string[]}
 */
export function readLocalesFromTs(localesTsPath) {
  const src = fs.readFileSync(localesTsPath, "utf8");
  const match = src.match(/export const locales\s*=\s*\[([\s\S]*?)\]\s*as const/u);
  if (!match) {
    throw new Error(`Could not parse locales from ${localesTsPath}`);
  }
  const inner = match[1];
  const locales = [...inner.matchAll(/"([^"]+)"/gu)].map((m) => m[1]);
  if (locales.length === 0) {
    throw new Error(`No locales found in ${localesTsPath}`);
  }
  return locales;
}
