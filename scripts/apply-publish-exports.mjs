#!/usr/bin/env node
/**
 * RFC 0058 — only 3 consumer npm packages are public.
 * plugin-* / runtime / model / plugin / adapter / wasm = monorepo-internal (private).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGES_DIR = path.join(ROOT, "packages");

const PUBLIC_CONSUMER = new Set([
  "@gopdfjs/engine",
  "@gopdfjs/adapter-browser",
  "@gopdfjs/adapter-node",
]);

function mapExportsToSrc(exportsField) {
  const out = {};
  for (const [key, value] of Object.entries(exportsField ?? {})) {
    if (typeof value === "string") {
      out[key] = value;
    } else if (value && typeof value === "object" && "development" in value) {
      out[key] = value.development;
    } else {
      out[key] = value;
    }
  }
  return out;
}

function distExport(srcPath) {
  const js = srcPath.replace("./src/", "./dist/").replace(/\.ts$/, ".js");
  return {
    types: js.replace(/\.js$/, ".d.ts"),
    development: srcPath,
    import: js,
  };
}

function mapExportsToDist(exportsField) {
  const out = {};
  for (const [key, value] of Object.entries(exportsField ?? {})) {
    if (typeof value === "string" && value.startsWith("./src/") && value.endsWith(".ts")) {
      out[key] = distExport(value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

for (const dir of fs.readdirSync(PACKAGES_DIR)) {
  const pkgPath = path.join(PACKAGES_DIR, dir, "package.json");
  if (!fs.existsSync(pkgPath)) continue;

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const isPublic = PUBLIC_CONSUMER.has(pkg.name);

  if (isPublic) {
    delete pkg.private;
    pkg.publishConfig = { access: "public" };
    pkg.files = ["dist"];
    pkg.scripts = {
      ...pkg.scripts,
      build: "vite build",
      prepublishOnly: "pnpm run build",
    };
    if (pkg.exports) {
      pkg.exports = mapExportsToDist(pkg.exports);
    }
    if (pkg.main?.startsWith("./src/")) {
      pkg.main = pkg.main.replace("./src/", "./dist/").replace(/\.ts$/, ".js");
    }
    if (pkg.types?.startsWith("./src/")) {
      pkg.types = pkg.types.replace("./src/", "./dist/").replace(/\.ts$/, ".d.ts");
    }
    fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
    console.log(`PUBLIC  packages/${dir}/package.json`);
    continue;
  }

  pkg.private = true;
  delete pkg.publishConfig;
  delete pkg.prepublishOnly;
  delete pkg.files;

  if (pkg.exports) {
    pkg.exports = mapExportsToSrc(pkg.exports);
  }
  if (pkg.main?.startsWith("./dist/")) {
    pkg.main = pkg.main.replace("./dist/", "./src/").replace(/\.js$/, ".ts");
  }
  if (pkg.types?.startsWith("./dist/")) {
    pkg.types = pkg.types.replace("./dist/", "./src/").replace(/\.d.ts$/, ".ts");
  }
  if (pkg.scripts?.build === "vite build") {
    const { build, prepublishOnly, ...rest } = pkg.scripts;
    pkg.scripts = rest;
  }

  fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log(`INTERNAL packages/${dir}/package.json`);
}
