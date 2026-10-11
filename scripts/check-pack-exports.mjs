#!/usr/bin/env node
/**
 * Pack sanity for the three public @gopdfjs/* packages (ACG-128).
 *
 * Workspace package.json may keep exports.development → ./src/*.ts for Vite.
 * The packed package.json (publishConfig.exports) must resolve only ./dist/*
 * for default, development, and production conditions. The tarball must not
 * ship src/ or name src/ as an import target.
 */
import { execFileSync, execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGES_DIR = path.join(ROOT, "packages");
const WASM_PKG_DIR = path.join(PACKAGES_DIR, "wasm", "pkg");

const PUBLIC_PACKAGE_DIRS = ["engine", "adapter-browser", "adapter-node"];
const PACKAGE_SCOPE = "@gopdfjs";

const DEVELOPMENT_CONDITION = "development";
const DIST_EXPORT_PREFIX = "./dist/";
const SOURCE_TS_SUFFIX = ".ts";
const DECLARATION_SUFFIX = ".d.ts";
const TARBALL_SUFFIX = ".tgz";

const CONSUMER_CONDITIONS = [[], [DEVELOPMENT_CONDITION], ["production"]];

const errors = [];
const notes = [];

function fail(message) {
  errors.push(message);
}

function collectExportTargets(value, targets = []) {
  if (typeof value === "string") {
    targets.push(value);
    return targets;
  }
  if (value && typeof value === "object") {
    for (const nested of Object.values(value)) collectExportTargets(nested, targets);
  }
  return targets;
}

function nonDevelopmentTargets(exportsField) {
  const targets = [];
  for (const value of Object.values(exportsField ?? {})) {
    if (typeof value === "string") {
      targets.push(value);
      continue;
    }
    if (!value || typeof value !== "object") continue;
    for (const [condition, target] of Object.entries(value)) {
      if (condition === DEVELOPMENT_CONDITION) continue;
      collectExportTargets(target, targets);
    }
  }
  return targets;
}

function isSourceTarget(target) {
  const isDeclaration = target.endsWith(DECLARATION_SUFFIX);
  return target.includes("/src/") || (target.endsWith(SOURCE_TS_SUFFIX) && !isDeclaration);
}

function isInsideDir(file, dir) {
  const resolvedFile = fs.realpathSync(file);
  const resolvedDir = fs.realpathSync(dir);
  const prefix = resolvedDir.endsWith(path.sep) ? resolvedDir : resolvedDir + path.sep;
  return resolvedFile === resolvedDir || resolvedFile.startsWith(prefix);
}

function assertDistTarget(label, target) {
  if (isSourceTarget(target)) {
    fail(`${label}: ${JSON.stringify(target)} points at source`);
    return false;
  }
  if (!target.startsWith(DIST_EXPORT_PREFIX)) {
    fail(`${label}: ${JSON.stringify(target)} is not under ${DIST_EXPORT_PREFIX}`);
    return false;
  }
  return true;
}

function assertWorkspaceMetadata(dir) {
  const pkgPath = path.join(PACKAGES_DIR, dir, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const label = `packages/${dir}`;
  const targets = [
    ...nonDevelopmentTargets(pkg.exports),
    ...(pkg.main ? [pkg.main] : []),
    ...(pkg.types ? [pkg.types] : []),
    ...collectExportTargets(pkg.publishConfig?.exports),
  ];
  if (targets.length === 0) {
    fail(`${label}: no non-development export targets`);
    return;
  }
  for (const target of targets) assertDistTarget(`${label} metadata`, target);
}

function assertPackedTree(extractedDir, label) {
  const pkg = JSON.parse(fs.readFileSync(path.join(extractedDir, "package.json"), "utf8"));
  const targets = [
    ...collectExportTargets(pkg.exports),
    ...(pkg.main ? [pkg.main] : []),
    ...(pkg.types ? [pkg.types] : []),
  ];
  if (targets.length === 0) {
    fail(`${label}: packed package.json has no export targets`);
  }
  for (const target of targets) {
    if (!assertDistTarget(`${label} tarball`, target)) continue;
    const file = path.join(extractedDir, target);
    if (!fs.existsSync(file)) fail(`${label}: packed target missing ${target}`);
  }

  const srcHits = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "src") srcHits.push(path.relative(extractedDir, full));
        walk(full);
      }
    }
  };
  walk(extractedDir);
  if (srcHits.length > 0) fail(`${label}: tarball contains src/: ${srcHits.join(", ")}`);
  return pkg.name;
}

function consumerResolve(consumerDir, packageName, conditions) {
  const script = `process.stdout.write(import.meta.resolve(${JSON.stringify(packageName)}))`;
  const args = ["--input-type=module", "--eval", script];
  if (conditions.length > 0) args.unshift(`--conditions=${conditions.join(",")}`);
  return execFileSync(process.execPath, args, {
    cwd: consumerDir,
    encoding: "utf8",
  });
}

function assertConsumerResolve(extractedDir, consumerDir, packageName) {
  const dest = path.join(consumerDir, "node_modules", packageName);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(extractedDir, dest, { recursive: true });

  for (const conditions of CONSUMER_CONDITIONS) {
    const label = conditions.length > 0 ? conditions.join(",") : "default";
    let resolved;
    try {
      resolved = consumerResolve(consumerDir, packageName, conditions);
    } catch (err) {
      fail(`${packageName}: resolve (${label}) failed: ${err.message}`);
      continue;
    }
    const file = fileURLToPath(resolved);
    const distDir = path.join(dest, "dist");
    if (!isInsideDir(file, distDir)) {
      fail(`${packageName}: resolve (${label}) -> ${file} is outside dist/`);
      continue;
    }
    if (!fs.existsSync(file)) {
      fail(`${packageName}: resolve (${label}) -> ${file} does not exist`);
      continue;
    }
    const relative = path.relative(fs.realpathSync(distDir), fs.realpathSync(file));
    notes.push(`${packageName} (${label}) -> dist/${relative}`);
  }
}

function ensureBuilds() {
  if (!fs.existsSync(WASM_PKG_DIR)) {
    console.log("packages/wasm/pkg missing — running pnpm build:wasm");
    execSync("pnpm build:wasm", { cwd: ROOT, stdio: "inherit" });
  }
  const filters = PUBLIC_PACKAGE_DIRS.map((dir) => `--filter=${PACKAGE_SCOPE}/${dir}`).join(" ");
  console.log("building public packages");
  execSync(`pnpm ${filters} build`, { cwd: ROOT, stdio: "inherit" });
}

function packedTarball(pkgDir) {
  const names = fs
    .readdirSync(pkgDir)
    .filter((name) => name.endsWith(TARBALL_SUFFIX))
    .sort((a, b) => a.localeCompare(b));
  return names.at(-1);
}

function main() {
  console.log("gopdf pack exports check\n");
  for (const dir of PUBLIC_PACKAGE_DIRS) assertWorkspaceMetadata(dir);

  ensureBuilds();

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "gopdf-pack-"));
  const consumerDir = path.join(tmp, "consumer");
  fs.mkdirSync(consumerDir, { recursive: true });

  try {
    for (const dir of PUBLIC_PACKAGE_DIRS) {
      const pkgDir = path.join(PACKAGES_DIR, dir);
      execSync("pnpm pack", { cwd: pkgDir, stdio: "pipe" });
      const tarball = packedTarball(pkgDir);
      if (!tarball) {
        fail(`packages/${dir}: pnpm pack produced no tarball`);
        continue;
      }
      const tarballPath = path.join(pkgDir, tarball);
      const extractDir = path.join(tmp, dir);
      fs.mkdirSync(extractDir, { recursive: true });
      execFileSync("tar", ["-xzf", tarballPath, "-C", extractDir], { stdio: "pipe" });
      fs.rmSync(tarballPath);

      const extracted = path.join(extractDir, "package");
      const packageName = assertPackedTree(extracted, `packages/${dir}`);
      assertConsumerResolve(extracted, consumerDir, packageName);
      console.log(`packed ${tarball}`);
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  console.log("\nPacked consumer resolution:");
  for (const note of notes) console.log(`  ok ${note}`);

  if (errors.length > 0) {
    console.log("\nFAILED:");
    for (const message of errors) console.log(`  ${message}`);
    console.log(`\n${errors.length} error(s)`);
    process.exit(1);
  }
  console.log("\nOK — packed packages resolve built files under dist/");
}

main();
