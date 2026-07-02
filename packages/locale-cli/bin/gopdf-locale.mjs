#!/usr/bin/env node
/**
 * gopdf-locale — next-intl JSON locale tooling (en-US canonical).
 */
import { runCheck } from "../lib/check.mjs";
import { runPrune } from "../lib/prune.mjs";
import {
  defaultLocaleLabelsTs,
  defaultLocalesTs,
  defaultMessagesDir,
  defaultUiSrcDir,
  resolveRepoRoot,
} from "../lib/resolve-repo-root.mjs";
import { resolveMessagesDir } from "../lib/resolve-messages-dir.mjs";
import { runSync } from "../lib/sync.mjs";

const args = process.argv.slice(2);
const cmd = args[0];
const flags = new Set(args.filter((a) => a.startsWith("--")));
const jsonOutput = flags.has("--json");
const strict = flags.has("--strict");

const HELP = `Usage: gopdf-locale <sync|prune|check> [options]

next-intl message files: nested JSON, en-US.json is source of truth.

Commands:
  sync    Merge missing keys from en-US.json into other locale files.
  prune   Remove keys not present in en-US.json.
  check   Parity, ICU placeholders, UI keys, locale labels.

Options:
  --messages-dir=DIR   Messages directory
  --repo-root=DIR      Monorepo root (check; auto-detected)
  --strict             Fail on orphan en-US keys (not used by @gopdfjs/ui)
  --json               Machine-readable check output

Environment:
  MESSAGES_DIR         Overrides messages directory
  GOPDF_REPO_ROOT      Monorepo root for check

Examples:
  gopdf-locale check
  gopdf-locale check --json
  cd site && gopdf-locale sync
`;

if (!cmd || cmd === "--help" || cmd === "-h") {
  console.log(HELP);
  process.exit(0);
}

if (cmd !== "sync" && cmd !== "prune" && cmd !== "check") {
  console.error(`Unknown command: ${cmd}`);
  console.error(HELP);
  process.exit(1);
}

try {
  if (cmd === "check") {
    const repoRoot = resolveRepoRoot(process.argv, process.env);
    const hasExplicitMessages =
      Boolean(process.env.MESSAGES_DIR) ||
      args.some((a) => a.startsWith("--messages-dir="));
    const messagesDir = hasExplicitMessages
      ? resolveMessagesDir(process.argv, process.env)
      : defaultMessagesDir(repoRoot);

    const result = runCheck({
      repoRoot,
      messagesDir,
      localesTsPath: defaultLocalesTs(repoRoot),
      localeLabelsTsPath: defaultLocaleLabelsTs(repoRoot),
      uiSrcDir: defaultUiSrcDir(repoRoot),
      strict,
    });

    if (jsonOutput) {
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.ok ? 0 : 1);
    }

    if (!result.ok) {
      if (result.warnings.length > 0) {
        console.warn("warnings:");
        for (const w of result.warnings) {
          console.warn(`  ${w}`);
        }
      }
      console.error("errors:");
      for (const err of result.errors) {
        console.error(`  ${err}`);
      }
      console.error(`\ngopdf-locale check failed (${result.errors.length} error(s)).`);
      process.exit(1);
    }

    if (result.warnings.length > 0) {
      console.warn("warnings:");
      for (const w of result.warnings) {
        console.warn(`  ${w}`);
      }
    }

    console.log(
      `gopdf-locale check passed: ${result.locales.length} locales, ${result.messageLeafCount} message keys, ${result.uiKeyCount} UI keys` +
        (result.unusedKeyCount > 0
          ? `, ${result.unusedKeyCount} reserved/orphan key(s) noted`
          : "") +
        ".",
    );
    process.exit(0);
  }

  const messagesDir = resolveMessagesDir(process.argv);
  if (cmd === "sync") {
    runSync(messagesDir);
  } else {
    runPrune(messagesDir);
  }
} catch (e) {
  const err = /** @type {Error} */ (e);
  console.error(err.message || err);
  process.exit(1);
}
