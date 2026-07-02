/**
 * RFC 0005 gate: next-intl JSON parity + @gopdfjs/ui key coverage.
 */
import {
  CRITICAL_SUBSTRINGS,
  collectStringLeaves,
  readMessagesJson,
} from "./message-leaves.mjs";
import { runParity } from "./parity.mjs";
import { readLocalesFromTs } from "./read-locales.mjs";
import {
  collectUiTranslationKeys,
  missingLocaleLabels,
} from "./ui-keys.mjs";

/** Keys allowed in en-US without a current @gopdfjs/ui reference. */
const RESERVED_KEY_PREFIXES = ["Metadata.", "ToolPages."];

/**
 * @typedef {{
 *   repoRoot: string;
 *   messagesDir: string;
 *   localesTsPath: string;
 *   localeLabelsTsPath: string;
 *   uiSrcDir: string;
 *   strict?: boolean;
 * }} CheckOptions
 */

/**
 * @typedef {{
 *   ok: true;
 *   locales: string[];
 *   uiKeyCount: number;
 *   messageLeafCount: number;
 *   unusedKeyCount: number;
 *   warnings: string[];
 * }} CheckOk
 * @typedef {{ ok: false; errors: string[]; warnings: string[] }} CheckFail
 * @typedef {CheckOk | CheckFail} CheckResult
 */

/**
 * @param {string} dotPath
 */
function isReservedMessageKey(dotPath) {
  return RESERVED_KEY_PREFIXES.some((p) => dotPath.startsWith(p));
}

/**
 * @param {CheckOptions} options
 * @returns {CheckResult}
 */
export function runCheck(options) {
  const {
    messagesDir,
    localesTsPath,
    localeLabelsTsPath,
    uiSrcDir,
    strict = false,
  } = options;
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  const locales = readLocalesFromTs(localesTsPath);

  const parity = runParity(messagesDir, locales);
  if (!parity.ok) {
    errors.push(...parity.errors);
  }

  let enLeaves;
  try {
    enLeaves = collectStringLeaves(readMessagesJson(messagesDir, "en-US.json"));
  } catch (e) {
    const err = /** @type {Error} */ (e);
    errors.push(err.message || String(e));
    return { ok: false, errors, warnings };
  }

  const uiKeys = collectUiTranslationKeys(uiSrcDir);
  for (const key of [...uiKeys].sort()) {
    if (!enLeaves.has(key)) {
      errors.push(`en-US.json missing @gopdfjs/ui translation key: ${key}`);
    }
  }

  for (const dotPath of [...enLeaves.keys()].sort()) {
    if (uiKeys.has(dotPath) || isReservedMessageKey(dotPath)) continue;
    warnings.push(
      `en-US.json key not referenced by @gopdfjs/ui (orphan): ${dotPath}`,
    );
  }

  for (const dotPath of Object.keys(CRITICAL_SUBSTRINGS)) {
    if (!enLeaves.has(dotPath)) {
      errors.push(`en-US.json missing reserved ICU key: ${dotPath}`);
    }
  }

  const missingLabels = missingLocaleLabels(localeLabelsTsPath, locales);
  for (const loc of missingLabels) {
    errors.push(`locale-labels.ts missing display label for locale: ${loc}`);
  }

  const unusedKeyCount = warnings.length;

  if (strict && warnings.length > 0) {
    errors.push(
      ...warnings.map((w) => `[strict] ${w}`),
    );
  }

  if (errors.length > 0) {
    return { ok: false, errors, warnings };
  }

  return {
    ok: true,
    locales,
    uiKeyCount: uiKeys.size,
    messageLeafCount: enLeaves.size,
    unusedKeyCount,
    warnings,
  };
}
