/**
 * Remove keys from each locale JSON that no longer exist in en-US.json.
 */
import fs from "node:fs";
import path from "node:path";

/**
 * @param {unknown} target
 * @param {unknown} source
 */
function prune(target, source) {
  if (source === null || typeof source !== "object" || Array.isArray(source)) {
    return;
  }
  if (target === null || typeof target !== "object" || Array.isArray(target)) {
    return;
  }
  for (const key of Object.keys(target)) {
    if (!(key in source)) {
      delete target[key];
      continue;
    }
    const sv = source[key];
    const tv = target[key];
    if (
      sv !== null &&
      typeof sv === "object" &&
      !Array.isArray(sv) &&
      tv !== null &&
      typeof tv === "object" &&
      !Array.isArray(tv)
    ) {
      prune(tv, sv);
    }
  }
}

/**
 * @param {string} messagesDir absolute path to folder containing en-US.json
 */
export function runPrune(messagesDir) {
  const enPath = path.join(messagesDir, "en-US.json");
  if (!fs.existsSync(enPath)) {
    throw new Error(`Missing en-US.json at ${enPath}`);
  }
  const en = JSON.parse(fs.readFileSync(enPath, "utf8"));

  for (const name of fs.readdirSync(messagesDir)) {
    if (!name.endsWith(".json") || name === "en-US.json") continue;
    const p = path.join(messagesDir, name);
    const loc = JSON.parse(fs.readFileSync(p, "utf8"));
    prune(loc, en);
    fs.writeFileSync(p, `${JSON.stringify(loc, null, 2)}\n`);
  }
  console.log(
    "Pruned extra keys from non-en-US locale files (structure matches en-US.json).",
  );
}
