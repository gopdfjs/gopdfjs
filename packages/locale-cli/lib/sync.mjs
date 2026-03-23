/**
 * Deep-merge missing keys from en-US.json into every other locale JSON.
 */
import fs from "node:fs";
import path from "node:path";

/**
 * @param {Record<string, unknown>} target
 * @param {unknown} source
 */
function deepFill(target, source) {
  if (source === null || typeof source !== "object" || Array.isArray(source)) {
    return;
  }
  for (const key of Object.keys(source)) {
    const sv = source[key];
    if (sv !== null && typeof sv === "object" && !Array.isArray(sv)) {
      if (!target[key] || typeof target[key] !== "object" || Array.isArray(target[key])) {
        target[key] = {};
      }
      deepFill(target[key], sv);
    } else if (target[key] === undefined) {
      target[key] = sv;
    }
  }
}

/**
 * @param {string} messagesDir absolute path to folder containing en-US.json
 */
export function runSync(messagesDir) {
  const enPath = path.join(messagesDir, "en-US.json");
  if (!fs.existsSync(enPath)) {
    throw new Error(`Missing en-US.json at ${enPath}`);
  }
  const en = /** @type {Record<string, unknown>} */ (
    JSON.parse(fs.readFileSync(enPath, "utf8"))
  );

  for (const name of fs.readdirSync(messagesDir)) {
    if (!name.endsWith(".json") || name === "en-US.json") continue;
    const p = path.join(messagesDir, name);
    const loc = /** @type {Record<string, unknown>} */ (
      JSON.parse(fs.readFileSync(p, "utf8"))
    );
    deepFill(loc, en);
    fs.writeFileSync(p, `${JSON.stringify(loc, null, 2)}\n`);
  }
  console.log("Locale keys synced from en-US.json");
}
