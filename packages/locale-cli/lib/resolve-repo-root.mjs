/**
 * Locate monorepo root (site/messages + packages/i18n).
 */
import fs from "node:fs";
import path from "node:path";

/**
 * @param {string[]} [argv]
 * @param {NodeJS.ProcessEnv} [env]
 * @param {string} [cwd]
 */
export function resolveRepoRoot(
  argv = process.argv,
  env = process.env,
  cwd = process.cwd(),
) {
  const fromEnv = env.GOPDF_REPO_ROOT;
  if (fromEnv && String(fromEnv).trim() !== "") {
    return path.resolve(String(fromEnv));
  }
  const arg = argv.find((a) => a.startsWith("--repo-root="));
  if (arg) {
    return path.resolve(arg.slice("--repo-root=".length));
  }

  let dir = path.resolve(cwd);
  const root = path.parse(dir).root;
  while (dir !== root) {
    const messages = path.join(dir, "site", "messages", "en-US.json");
    const localesTs = path.join(dir, "packages", "i18n", "src", "locales.ts");
    if (fs.existsSync(messages) && fs.existsSync(localesTs)) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  throw new Error(
    "Could not find gopdf repo root (expected site/messages/en-US.json). Use --repo-root=DIR or GOPDF_REPO_ROOT.",
  );
}

/**
 * @param {string} repoRoot
 */
export function defaultMessagesDir(repoRoot) {
  return path.join(repoRoot, "site", "messages");
}

/**
 * @param {string} repoRoot
 */
export function defaultLocalesTs(repoRoot) {
  return path.join(repoRoot, "packages", "i18n", "src", "locales.ts");
}

/**
 * @param {string} repoRoot
 */
export function defaultLocaleLabelsTs(repoRoot) {
  return path.join(repoRoot, "packages", "i18n", "src", "locale-labels.ts");
}

/**
 * @param {string} repoRoot
 */
export function defaultUiSrcDir(repoRoot) {
  return path.join(repoRoot, "packages", "ui", "src");
}
