/**
 * next-intl JSON helpers: nested string leaves and ICU placeholder names.
 */
import fs from "node:fs";
import path from "node:path";

/**
 * @param {unknown} obj
 * @param {string} [prefix]
 * @returns {Map<string, string>}
 */
export function collectStringLeaves(obj, prefix = "") {
  /** @type {Map<string, string>} */
  const out = new Map();
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    return out;
  }
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") {
      out.set(p, v);
    } else if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      for (const [kp, vp] of collectStringLeaves(v, p)) {
        out.set(kp, vp);
      }
    }
  }
  return out;
}

/**
 * ICU placeholders: `{name}` or `{name, select, ...}`.
 * @param {string} s
 * @returns {Set<string>}
 */
export function placeholderNames(s) {
  /** @type {Set<string>} */
  const set = new Set();
  const re = /\{([a-zA-Z_][a-zA-Z0-9_]*)(?:,|})/g;
  let m;
  while ((m = re.exec(s)) !== null) {
    set.add(m[1]);
  }
  return set;
}

/**
 * @param {string} messagesDir
 * @param {string} fileName
 */
export function readMessagesJson(messagesDir, fileName) {
  const full = path.join(messagesDir, fileName);
  const raw = fs.readFileSync(full, "utf8");
  return /** @type {Record<string, unknown>} */ (JSON.parse(raw));
}

/** @type {Readonly<Record<string, readonly string[]>>} */
export const CRITICAL_SUBSTRINGS = {
  "ToolPages.headerFooter.tokensLine": ["{pageToken}", "{totalToken}"],
  "ToolPages.headerFooter.footerPlaceholder": ["{pageToken}", "{totalToken}"],
  "ToolPages.headerFooter.defaultFooterForPdf": ["{pageToken}", "{totalToken}"],
};
