#!/usr/bin/env node
/** Enforce plugin → runtime → adapter dependency direction (RFC 0058 §2.3). */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGES = path.join(ROOT, "packages");

const PLUGIN_FORBIDDEN = new Set([
  "@gopdfjs/adapter",
  "@gopdfjs/adapter-browser",
  "@gopdfjs/adapter-node",
  "@gopdfjs/engine",
]);

const RUNTIME_FORBIDDEN = new Set([
  "@gopdfjs/adapter",
  "@gopdfjs/adapter-browser",
  "@gopdfjs/adapter-node",
  "@gopdfjs/engine",
]);

const ADAPTER_FORBIDDEN = new Set(["@gopdfjs/runtime"]);

function readProdDeps(pkgJsonPath) {
  const data = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
  return Object.keys(data.dependencies ?? {});
}

function main() {
  const errors = [];

  for (const entry of fs.readdirSync(PACKAGES).sort()) {
    const pkgJsonPath = path.join(PACKAGES, entry, "package.json");
    if (!fs.existsSync(pkgJsonPath)) continue;

    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
    const name = pkg.name ?? entry;
    const prod = readProdDeps(pkgJsonPath);

    if (name.startsWith("@gopdfjs/plugin-")) {
      for (const bad of PLUGIN_FORBIDDEN) {
        if (prod.includes(bad)) {
          errors.push(`${name}: forbidden prod dep ${bad} (plugin → runtime only)`);
        }
      }
    }

    if (name === "@gopdfjs/runtime") {
      for (const bad of RUNTIME_FORBIDDEN) {
        if (prod.includes(bad)) {
          errors.push(`${name}: forbidden prod dep ${bad} (runtime must not import adapter)`);
        }
      }
    }

    if (name === "@gopdfjs/adapter") {
      for (const bad of ADAPTER_FORBIDDEN) {
        if (prod.includes(bad)) {
          errors.push(`${name}: forbidden prod dep ${bad} (adapter must not import runtime)`);
        }
      }
    }
  }

  if (errors.length) {
    console.error("Layer dependency check FAILED:\n");
    for (const line of errors) console.error(`  - ${line}`);
    process.exit(1);
  }

  console.log("Layer dependency check OK (plugin → runtime → adapter)");
}

main();
