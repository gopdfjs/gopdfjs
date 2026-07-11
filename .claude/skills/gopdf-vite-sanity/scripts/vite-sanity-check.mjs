#!/usr/bin/env node
/**
 * Vite publish sanity — 3 public @gopdfjs/* packages only.
 * Golden rule: no plugin-* / adapter / wasm / runtime on npm.
 */
import { execFileSync, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const PACKAGES = path.join(ROOT, "packages");

const PUBLIC = ["engine", "adapter-browser", "adapter-node"];
const PUBLIC_NAMES = new Set(PUBLIC.map((d) => `@gopdfjs/${d}`));

/** Allowed @gopdfjs/* in published adapter package.json dependencies. */
const ADAPTER_ALLOWED_DEPS = new Set(["@gopdfjs/engine"]);

/** Forbidden @gopdfjs/* prefixes in published .d.ts (private packages). */
const FORBIDDEN_DTS_PREFIXES = [
  "@gopdfjs/adapter",
  "@gopdfjs/model",
  "@gopdfjs/plugin",
  "@gopdfjs/runtime",
  "@gopdfjs/wasm",
];

const errors = [];
const warnings = [];

function fail(msg) {
  errors.push(msg);
}

function warn(msg) {
  warnings.push(msg);
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

function rg(pattern, file) {
  if (!fs.existsSync(file)) return [];
  const text = fs.readFileSync(file, "utf8");
  const re = new RegExp(pattern, "gm");
  const hits = [];
  let m;
  while ((m = re.exec(text)) !== null) hits.push(m[0]);
  return hits;
}

console.log("gopdf vite sanity check\n");

// —— Repo hygiene ——
if (execSync("git grep -l tsup -- . ':!pnpm-lock.yaml' 2>/dev/null || true", {
  cwd: ROOT,
  encoding: "utf8",
}).trim()) {
  fail("tsup still referenced in repo — use Vite lib build only");
}

for (const dir of ["tsconfig.build.json"]) {
  if (fs.existsSync(path.join(PACKAGES, "engine", dir))) {
    fail(`packages/engine/${dir} exists — use vite.config.ts + tsconfig.json only`);
  }
}

// —— Golden rule: plugin-* private ——
for (const entry of fs.readdirSync(PACKAGES)) {
  const pkgPath = path.join(PACKAGES, entry, "package.json");
  if (!fs.existsSync(pkgPath)) continue;
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const name = pkg.name ?? "";
  if (name.startsWith("@gopdfjs/plugin-") && !pkg.private) {
    fail(`${name} must stay private: true (never public npm)`);
  }
  if (PUBLIC_NAMES.has(name) && pkg.private) {
    fail(`${name} is public consumer package — remove private: true`);
  }
}

// —— Public package build = vite ——
for (const dir of PUBLIC) {
  const pkg = readJson(`packages/${dir}/package.json`);
  if (pkg.scripts?.build !== "vite build") {
    fail(`packages/${dir}: build must be "vite build", got ${JSON.stringify(pkg.scripts?.build)}`);
  }
  if (!fs.existsSync(path.join(PACKAGES, dir, "vite.config.ts"))) {
    fail(`packages/${dir}/vite.config.ts missing`);
  }
}

// —— Export guards ——
for (const cmd of ["check:public-exports", "check:layer-deps"]) {
  try {
    execSync(`pnpm ${cmd}`, { cwd: ROOT, stdio: "pipe" });
  } catch {
    fail(`pnpm ${cmd} failed`);
  }
}

// —— Build 3 public packages ——
try {
  execSync(
    "pnpm --filter=@gopdfjs/engine --filter=@gopdfjs/adapter-browser --filter=@gopdfjs/adapter-node build",
    { cwd: ROOT, stdio: "inherit" },
  );
} catch {
  fail("vite build failed for one or more public packages");
  printReport();
  process.exit(1);
}

// —— engine dist: no runtime @gopdfjs imports ——
const engineJs = path.join(PACKAGES, "engine/dist/index.js");
if (!fs.existsSync(engineJs)) {
  fail("packages/engine/dist/index.js missing after build");
} else {
  const imports = rg(String.raw`from\s+["']@gopdfjs/[^"']+["']`, engineJs);
  if (imports.length > 0) {
    fail(`engine dist/index.js imports private @gopdfjs/*: ${imports.join(", ")}`);
  }
}

// —— .d.ts: no private package imports ——
for (const dir of PUBLIC) {
  const dts = path.join(PACKAGES, dir, "dist/index.d.ts");
  if (!fs.existsSync(dts)) {
    fail(`packages/${dir}/dist/index.d.ts missing`);
    continue;
  }
  const text = fs.readFileSync(dts, "utf8");
  for (const prefix of FORBIDDEN_DTS_PREFIXES) {
    if (text.includes(`'${prefix}`) || text.includes(`"${prefix}`)) {
      fail(`packages/${dir}/dist/index.d.ts imports private ${prefix}* — inline public types`);
    }
  }
}

// —— Published dependencies (what npm install resolves) ——
for (const dir of PUBLIC) {
  const pkg = readJson(`packages/${dir}/package.json`);
  const deps = Object.keys(pkg.dependencies ?? {});
  if (dir === "engine") {
    for (const dep of deps) {
      if (dep.startsWith("@gopdfjs/")) {
        fail(`engine dependencies must not list ${dep} — bundle internal; npm deps only`);
      }
    }
  } else {
    for (const dep of deps) {
      if (dep.startsWith("@gopdfjs/") && !ADAPTER_ALLOWED_DEPS.has(dep)) {
        fail(
          `packages/${dir} dependencies lists ${dep} — private/unpublished; bundle or vendor in dist`,
        );
      }
    }
  }
}

// —— Adapter runtime: wasm must ship in tarball (no 4th public wasm pkg) ——
for (const dir of ["adapter-browser", "adapter-node"]) {
  const js = path.join(PACKAGES, dir, "dist/index.js");
  if (fs.existsSync(js) && rg(String.raw`@gopdfjs/wasm`, js).length > 0) {
    const hasWasmInDist = fs
      .readdirSync(path.join(PACKAGES, dir, "dist"), { recursive: true })
      .some((f) => String(f).endsWith(".wasm"));
    if (!hasWasmInDist) {
      fail(
        `packages/${dir} dist imports @gopdfjs/wasm but tarball has no .wasm — vendor into dist/files`,
      );
    }
  }
}

// —— npm pack smoke ——
for (const dir of PUBLIC) {
  try {
    const out = execFileSync("pnpm", ["pack", "--dry-run"], {
      cwd: path.join(PACKAGES, dir),
      encoding: "utf8",
    });
    if (out.includes("/src/") && !out.includes("Tarball Contents")) {
      warn(`${dir} pack listing mentions src/ — files should be dist-only`);
    }
    if (!out.includes("dist/index.js")) {
      fail(`packages/${dir} pnpm pack --dry-run: dist/index.js not in tarball`);
    }
  } catch {
    fail(`packages/${dir} pnpm pack --dry-run failed`);
  }
}

function printReport() {
  if (warnings.length) {
    console.log("\nWarnings:");
    for (const w of warnings) console.log(`  ⚠ ${w}`);
  }
  if (errors.length) {
    console.log("\nFAILED:");
    for (const e of errors) console.log(`  ✗ ${e}`);
    console.log(`\n${errors.length} error(s)`);
  } else {
    console.log("\nOK — vite publish sanity passed");
    if (warnings.length) console.log(`(${warnings.length} warning(s))`);
  }
}

printReport();
process.exit(errors.length ? 1 : 0);
