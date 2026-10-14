#!/usr/bin/env node
/** Guard public entrypoints — no accidental adapter/WASM/plugin leakage (RFC 0058). */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const ENGINE_EXPORTS_ONLY_DOT = path.join(ROOT, "packages/engine/package.json");
const PUBLIC_NPM_PACKAGES = [
  "packages/engine/package.json",
  "packages/adapter-browser/package.json",
  "packages/adapter-node/package.json",
];
const PRIVATE_NPM_PACKAGES = [
  "packages/adapter/package.json",
  "packages/fixtures/package.json",
  "packages/model/package.json",
  "packages/plugin/package.json",
  "packages/plugin-annotate/package.json",
  "packages/plugin-author/package.json",
  "packages/plugin-compare/package.json",
  "packages/plugin-extract/package.json",
  "packages/plugin-grayscale/package.json",
  "packages/plugin-inspect/package.json",
  "packages/plugin-redact/package.json",
  "packages/plugin-repair/package.json",
  "packages/plugin-shrink/package.json",
  "packages/plugin-struct/package.json",
  "packages/runtime/package.json",
  "packages/wasm/package.json",
];

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
  /from ['"]@gopdfjs\/engine['"]/,
  /from ['"]@gopdfjs\/adapter/,
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

  for (const rel of PUBLIC_NPM_PACKAGES) {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
    if (pkg.publishConfig?.access !== "public") {
      errors.push(`${rel}: publishConfig.access must be "public" for v1 public packages`);
    }
    if (pkg.private === true) {
      errors.push(`${rel}: public npm package must not set private: true`);
    }
  }

  for (const rel of PRIVATE_NPM_PACKAGES) {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
    if (pkg.private !== true) {
      errors.push(`${rel}: internal package must set private: true`);
    }
    if (pkg.publishConfig?.access === "public") {
      errors.push(`${rel}: internal package must not set publishConfig.access to "public"`);
    }
  }

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
