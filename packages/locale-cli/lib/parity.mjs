/**
 * Parity checks: every locale JSON matches en-US structure and ICU placeholders.
 */
import fs from "node:fs";
import path from "node:path";
import {
  CRITICAL_SUBSTRINGS,
  collectStringLeaves,
  placeholderNames,
  readMessagesJson,
} from "./message-leaves.mjs";

/**
 * @typedef {{ ok: true }} ParityOk
 * @typedef {{ ok: false, errors: string[] }} ParityFail
 * @typedef {ParityOk | ParityFail} ParityResult
 */

/**
 * @param {string} messagesDir
 * @param {readonly string[]} locales
 * @returns {ParityResult}
 */
export function runParity(messagesDir, locales) {
  /** @type {string[]} */
  const errors = [];

  const enPath = path.join(messagesDir, "en-US.json");
  if (!fs.existsSync(messagesDir)) {
    errors.push(`missing messages directory: ${messagesDir}`);
    return { ok: false, errors };
  }
  if (!fs.existsSync(enPath)) {
    errors.push(`missing canonical file: ${enPath}`);
    return { ok: false, errors };
  }

  const enLeaves = collectStringLeaves(readMessagesJson(messagesDir, "en-US.json"));
  if (enLeaves.size <= 10) {
    errors.push(`en-US.json has too few string leaves (${enLeaves.size}); expected > 10`);
  }

  for (const loc of locales) {
    const file = path.join(messagesDir, `${loc}.json`);
    if (!fs.existsSync(file)) {
      errors.push(`missing messages file for locale ${loc}: ${file}`);
      continue;
    }

    if (loc === "en-US") continue;

    const locLeaves = collectStringLeaves(readMessagesJson(messagesDir, `${loc}.json`));
    const enPaths = new Set(enLeaves.keys());
    const lp = new Set(locLeaves.keys());

    if (lp.size !== enPaths.size || [...enPaths].some((p) => !lp.has(p))) {
      const missing = [...enPaths].filter((p) => !lp.has(p));
      const extra = [...lp].filter((p) => !enPaths.has(p));
      if (missing.length) {
        errors.push(`${loc}: missing keys vs en-US: ${missing.join(", ")}`);
      }
      if (extra.length) {
        errors.push(`${loc}: extra keys vs en-US: ${extra.join(", ")}`);
      }
    }

    for (const [dotPath, enVal] of enLeaves) {
      const translated = locLeaves.get(dotPath);
      if (translated === undefined) {
        errors.push(`${loc}: missing leaf ${dotPath}`);
        continue;
      }
      if (translated.trim().length === 0) {
        errors.push(`${loc}: empty string at ${dotPath}`);
      }
      const enPh = [...placeholderNames(enVal)].sort().join(",");
      const locPh = [...placeholderNames(translated)].sort().join(",");
      if (enPh !== locPh) {
        errors.push(
          `${loc}: ICU placeholder mismatch at ${dotPath} (en: {${enPh}} vs ${loc}: {${locPh}})`,
        );
      }
    }

    for (const [dotPath, needles] of Object.entries(CRITICAL_SUBSTRINGS)) {
      const val = locLeaves.get(dotPath);
      if (!val) {
        errors.push(`${loc}: missing critical key ${dotPath}`);
        continue;
      }
      for (const needle of needles) {
        if (!val.includes(needle)) {
          errors.push(`${loc}: ${dotPath} must include ${needle}`);
        }
      }
    }
  }

  const jsonFiles = fs
    .readdirSync(messagesDir)
    .filter((n) => n.endsWith(".json"))
    .map((n) => n.replace(/\.json$/u, ""));
  const localeSet = new Set(locales);
  for (const code of jsonFiles) {
    if (!localeSet.has(code)) {
      errors.push(`orphan messages file ${code}.json (not in locales.ts)`);
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true };
}
