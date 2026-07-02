/**
 * Static translation keys used by @gopdfjs/ui (RFC 0005).
 * Scans source for use-intl / next-intl patterns — no hard-coded file list.
 */
import fs from "node:fs";
import path from "node:path";

const SOURCE_EXT = /\.(?:tsx|ts|jsx|js)$/u;

/**
 * @param {string} dir
 * @returns {string[]}
 */
function listSourceFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  /** @type {string[]} */
  const files = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      files.push(...listSourceFiles(full));
    } else if (SOURCE_EXT.test(name)) {
      files.push(full);
    }
  }
  return files;
}

/**
 * @param {string} src
 * @returns {Map<string, string>} varName → namespace
 */
function collectTranslationBindings(src) {
  /** @type {Map<string, string>} */
  const bindings = new Map();
  const re =
    /(?:const|let)\s+(\w+)\s*=\s*useTranslations\(\s*["']([^"']+)["']\s*\)/gu;
  for (const m of src.matchAll(re)) {
    bindings.set(m[1], m[2]);
  }
  return bindings;
}

/**
 * @param {string} src
 * @param {Map<string, string>} bindings
 * @returns {Set<string>}
 */
function collectBoundCalls(src, bindings) {
  /** @type {Set<string>} */
  const keys = new Set();
  for (const [varName, namespace] of bindings) {
    const callRe = new RegExp(
      `\\b${varName}\\(\\s*["']([^"']+)["']\\s*\\)`,
      "gu",
    );
    for (const m of src.matchAll(callRe)) {
      keys.add(`${namespace}.${m[1]}`);
    }
  }
  return keys;
}

/**
 * Data-driven keys from nav/tool config (Header toolGroups).
 * @param {string} src
 * @returns {Set<string>}
 */
function collectDataDrivenKeys(src) {
  /** @type {Set<string>} */
  const keys = new Set();
  for (const m of src.matchAll(/groupKey:\s*["']([^"']+)["']/gu)) {
    keys.add(`NavGroups.${m[1]}`);
  }
  for (const m of src.matchAll(/nameKey:\s*["']([^"']+)["']/gu)) {
    keys.add(`Tools.${m[1]}`);
  }
  return keys;
}

/**
 * @param {string} uiSrcDir
 * @returns {{ keys: Set<string>; byFile: Map<string, Set<string>> }}
 */
export function scanUiTranslationKeys(uiSrcDir) {
  /** @type {Set<string>} */
  const keys = new Set();
  /** @type {Map<string, Set<string>>} */
  const byFile = new Map();

  for (const file of listSourceFiles(uiSrcDir)) {
    const src = fs.readFileSync(file, "utf8");
    if (!src.includes("useTranslations")) {
      const dataKeys = collectDataDrivenKeys(src);
      if (dataKeys.size === 0) continue;
    }

    const bindings = collectTranslationBindings(src);
    const fileKeys = new Set([
      ...collectBoundCalls(src, bindings),
      ...collectDataDrivenKeys(src),
    ]);

    if (fileKeys.size > 0) {
      byFile.set(path.relative(uiSrcDir, file), fileKeys);
      for (const k of fileKeys) {
        keys.add(k);
      }
    }
  }

  return { keys, byFile };
}

/**
 * @param {string} uiSrcDir
 * @returns {Set<string>} dot paths e.g. Navigation.allTools
 */
export function collectUiTranslationKeys(uiSrcDir) {
  return scanUiTranslationKeys(uiSrcDir).keys;
}

/**
 * @param {string} loc
 */
function localeLabelKeyPattern(loc) {
  const escaped = loc.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/u.test(loc)) {
    return new RegExp(`(?:["']${escaped}["']|${escaped})\\s*:`);
  }
  return new RegExp(`["']${escaped}["']\\s*:`);
}

/**
 * @param {string} localeLabelsTsPath
 * @param {readonly string[]} locales
 * @returns {string[]} missing locale codes
 */
export function missingLocaleLabels(localeLabelsTsPath, locales) {
  if (!fs.existsSync(localeLabelsTsPath)) {
    return [...locales];
  }
  const src = fs.readFileSync(localeLabelsTsPath, "utf8");
  /** @type {string[]} */
  const missing = [];
  for (const loc of locales) {
    if (!localeLabelKeyPattern(loc).test(src)) {
      missing.push(loc);
    }
  }
  return missing;
}

/** @deprecated use missingLocaleLabels */
export function missingLanguagePickerLabels(uiSrcDir, locales) {
  return missingLocaleLabels(
    path.join(uiSrcDir, "..", "i18n", "src", "locale-labels.ts"),
    locales,
  );
}
