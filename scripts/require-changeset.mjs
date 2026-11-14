#!/usr/bin/env node
/**
 * RFC 0062: a pull request that touches packages/ or crates/ must add a changeset.
 * Docs, demo, spec, and site-only diffs do not.
 */
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Directories whose diffs ship inside the public npm tarballs. */
export const GUARDED_PREFIXES = ["packages/", "crates/"];

/** Changeset markdown lives here. README is instructions, not a bump. */
export const CHANGESET_DIR = ".changeset/";
export const CHANGESET_README = ".changeset/README.md";

/**
 * @param {string} filePath
 * @returns {string}
 */
function normalizePath(filePath) {
  return filePath.replaceAll("\\", "/");
}

/**
 * @param {string[]} changedPaths
 * @returns {boolean}
 */
export function changesetRequired(changedPaths) {
  return changedPaths.some((filePath) => {
    const normalized = normalizePath(filePath);
    return GUARDED_PREFIXES.some((prefix) => normalized.startsWith(prefix));
  });
}

/**
 * @param {string[]} changedPaths
 * @returns {boolean}
 */
export function changesetPresent(changedPaths) {
  return changedPaths.some((filePath) => {
    const normalized = normalizePath(filePath);
    return (
      normalized.startsWith(CHANGESET_DIR) &&
      normalized.endsWith(".md") &&
      normalized !== CHANGESET_README
    );
  });
}

/**
 * @param {string[]} changedPaths
 * @returns {{ ok: boolean, reason: string }}
 */
export function evaluateChangesetGate(changedPaths) {
  if (!changesetRequired(changedPaths)) {
    return { ok: true, reason: "no-package-or-crate-diff" };
  }
  if (!changesetPresent(changedPaths)) {
    return { ok: false, reason: "missing-changeset" };
  }
  return { ok: true, reason: "changeset-present" };
}

/**
 * @param {string} baseSha
 * @param {string} headSha
 * @returns {string[]}
 */
export function changedPathsBetween(baseSha, headSha) {
  const output = execFileSync(
    "git",
    ["diff", "--name-only", `${baseSha}...${headSha}`],
    { encoding: "utf8" },
  );
  return output.split("\n").map((line) => line.trim()).filter(Boolean);
}

function runCli() {
  const baseSha = process.env.BASE_SHA ?? "";
  const headSha = process.env.HEAD_SHA ?? "";
  if (baseSha === "" || headSha === "") {
    console.error("BASE_SHA and HEAD_SHA are required");
    process.exit(1);
  }

  const result = evaluateChangesetGate(changedPathsBetween(baseSha, headSha));
  if (!result.ok) {
    console.error(
      "packages/ or crates/ changed without a new .changeset/*.md file (README.md does not count).",
    );
    process.exit(1);
  }
  console.log(`changeset gate: ${result.reason}`);
}

const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
const thisPath = fileURLToPath(import.meta.url);
if (entryPath === thisPath) {
  runCli();
}
