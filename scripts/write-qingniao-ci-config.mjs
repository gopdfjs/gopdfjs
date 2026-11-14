#!/usr/bin/env node
/**
 * RFC 0062: CI publish uses npm trusted publishing (OIDC).
 * `qingniao` otherwise treats a failed `pnpm whoami` as a hard auth error,
 * and OIDC is only present during `npm publish`, not during `whoami`.
 * Copy the repo config and turn that check off for the release job.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Doctor check that shells out to `pnpm whoami`. */
export const AUTH_CHECK = "auth";

/** Repo config the release job starts from. */
export const SOURCE_CONFIG_NAME = "qingniao.config.json";

/**
 * @param {Record<string, unknown>} source
 * @returns {Record<string, unknown>}
 */
export function ciQingniaoConfig(source) {
  const checks =
    source.checks !== null && typeof source.checks === "object"
      ? { ...source.checks }
      : {};
  checks[AUTH_CHECK] = false;
  return { ...source, checks };
}

/**
 * @param {string} sourcePath
 * @param {string} destPath
 * @returns {Record<string, unknown>}
 */
export function writeCiQingniaoConfig(sourcePath, destPath) {
  const source = JSON.parse(readFileSync(sourcePath, "utf8"));
  const next = ciQingniaoConfig(source);
  writeFileSync(destPath, `${JSON.stringify(next, null, 2)}\n`);
  return next;
}

function runCli() {
  const destPath = process.argv[2] ?? "";
  if (destPath === "") {
    console.error(
      "usage: node scripts/write-qingniao-ci-config.mjs <dest-path>",
    );
    process.exit(1);
  }
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const written = writeCiQingniaoConfig(
    path.join(root, SOURCE_CONFIG_NAME),
    destPath,
  );
  const checks = written.checks;
  const authDisabled =
    checks !== null &&
    typeof checks === "object" &&
    checks[AUTH_CHECK] === false;
  if (!authDisabled) {
    console.error("checks.auth was not disabled");
    process.exit(1);
  }
  console.log(`wrote ${destPath}`);
}

const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
const thisPath = fileURLToPath(import.meta.url);
if (entryPath === thisPath) {
  runCli();
}
