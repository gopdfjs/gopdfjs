#!/usr/bin/env node
/** Guard public entrypoints — no accidental adapter/WASM/plugin leakage (RFC 0058). */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const ENGINE_EXPORTS_ONLY_DOT = path.join(ROOT, "packages/engine/package.json");

const ENGINE_INDEX_FORBIDDEN = [
  /\bGopdfAdapter\b/,
  /\bGopdfEngine\b/,
  /\bsplitEncodedImages\b/,
  /\brenderPageTo/,
  /from "@gopdfjs\/plugin-/,
];

const ADAPTER_INDEX_FORBIDDEN = [
  /\bcreateBrowserGopdf\b/,
  /\bcreateNodeGopdf\b/,
  /from "@gopdfjs\/engine"/,
  /export\s*\{[^}]*\bcreateEngine\b/,
  /export\s*\{[^}]*\bcreateBrowserEngine\b/,
  /export\s*\{[^}]*\bcreateBrowserCanvasPort\b/,
  /export\s*\{[^}]*\bcreateBrowserPdfJsRuntime\b/,
  /export\s*\{[^}]*\bcreateNodeEngine\b/,
  /export\s*\{[^}]*\bcreateNodeCanvasPort\b/,
  /export\s*\{[^}]*\bcreateNodePdfJsRuntime\b/,
  /export\s*\{[^}]*\bcreateNodeOcrPort\b/,
  /export\s+\*\s+from\s+"@gopdfjs\/engine"/,
];

function main() {
  const errors = [];

  const enginePkg = JSON.parse(fs.readFileSync(ENGINE_EXPORTS_ONLY_DOT, "utf8"));
  const exportKeys = Object.keys(enginePkg.exports ?? {});
  if (new Set(exportKeys).size !== 1 || exportKeys[0] !== ".") {
    errors.push(
      `packages/engine/package.json: exports must be {'.': ...} only, got ${JSON.stringify(exportKeys.sort())}`,
    );
  }

  const engineIndex = fs.readFileSync(path.join(ROOT, "packages/engine/src/index.ts"), "utf8");
  for (const pattern of ENGINE_INDEX_FORBIDDEN) {
    if (pattern.test(engineIndex)) {
      errors.push(`packages/engine/src/index.ts: forbidden \`${pattern}\``);
    }
  }

  for (const rel of ["packages/adapter-browser/src/index.ts", "packages/adapter-node/src/index.ts"]) {
    const text = fs.readFileSync(path.join(ROOT, rel), "utf8");
    for (const pattern of ADAPTER_INDEX_FORBIDDEN) {
      if (pattern.test(text)) {
        errors.push(`${rel}: forbidden export \`${pattern}\``);
      }
    }
  }

  if (errors.length) {
    console.error("Public export check FAILED:\n");
    for (const line of errors) console.error(`  - ${line}`);
    process.exit(1);
  }

  console.log("Public export check OK");
}

main();
