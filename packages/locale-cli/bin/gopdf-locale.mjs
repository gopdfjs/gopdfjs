#!/usr/bin/env node
/**
 * gopdf-locale — sync or prune next-intl JSON message files (en-US as source of truth).
 *
 * Usage:
 *   gopdf-locale sync [--messages-dir=DIR]
 *   gopdf-locale prune [--messages-dir=DIR]
 *
 * Env: MESSAGES_DIR overrides default DIR (./messages relative to cwd).
 */
import { runPrune } from "../lib/prune.mjs";
import { resolveMessagesDir } from "../lib/resolve-messages-dir.mjs";
import { runSync } from "../lib/sync.mjs";

const args = process.argv.slice(2);
const cmd = args[0];

if (!cmd || cmd === "--help" || cmd === "-h") {
  console.log(`Usage: gopdf-locale <sync|prune> [--messages-dir=DIR]

Commands:
  sync   Merge missing keys from en-US.json into other locale JSON files (keeps translations).
  prune  Remove keys from locale files that are not present in en-US.json.

Environment:
  MESSAGES_DIR  Absolute or relative path to messages directory (default: ./messages from cwd).

Examples:
  cd site && gopdf-locale sync
  gopdf-locale prune --messages-dir=site/messages
`);
  process.exit(0);
}

if (cmd !== "sync" && cmd !== "prune") {
  console.error(`Unknown command: ${cmd}`);
  process.exit(1);
}

const messagesDir = resolveMessagesDir(process.argv);

try {
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
