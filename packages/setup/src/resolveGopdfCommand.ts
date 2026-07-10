import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { realpathSync } from "node:fs";
import path from "node:path";

const WHICH_COMMAND = "gopdf" as const;
const WHERE_COMMAND_WIN = "where gopdf" as const;
const WHICH_COMMAND_UNIX = "which gopdf" as const;
const PDF_CLI_SRC_ENTRY = "src/index.ts" as const;
const PDF_CLI_DIST_ENTRY = "dist/index.mjs" as const;
const TS_EXTENSION = ".ts" as const;

function resolveExistingPath(candidate: string): string {
  try {
    return realpathSync(candidate);
  } catch {
    return path.resolve(candidate);
  }
}

/**
 * Map a dev TypeScript CLI entry to the built dist binary when available.
 */
function resolveDistFromSourceEntry(sourceEntry: string): string | null {
  const normalized = path.resolve(sourceEntry);
  if (!normalized.endsWith(PDF_CLI_SRC_ENTRY)) {
    return null;
  }

  const packageRoot = path.dirname(path.dirname(normalized));
  const distEntry = path.join(packageRoot, PDF_CLI_DIST_ENTRY);
  return existsSync(distEntry) ? resolveExistingPath(distEntry) : null;
}

function resolveFromArgvBinary(argvBinary: string): string {
  const distFromSource = resolveDistFromSourceEntry(argvBinary);
  if (distFromSource) {
    return distFromSource;
  }

  const normalized = path.resolve(argvBinary);
  if (normalized.endsWith(TS_EXTENSION)) {
    throw new Error(
      `Cannot use TypeScript CLI entry for MCP config: ${normalized}. Build gopdf-cli (pnpm build:cli in gopdf-cli repo).`,
    );
  }

  return resolveExistingPath(normalized);
}

/**
 * Resolve the absolute path to the `gopdf` binary.
 * Falls back to `process.argv[1]` when invoked via the CLI, then bare `gopdf`.
 */
export function resolveGopdfCommand(commandPath?: string): string {
  if (commandPath) {
    const resolved = path.resolve(commandPath);
    if (resolved.endsWith(TS_EXTENSION)) {
      const distFromSource = resolveDistFromSourceEntry(resolved);
      if (distFromSource) {
        return distFromSource;
      }
      throw new Error(
        `Cannot use TypeScript CLI entry for MCP config: ${resolved}. Build gopdf-cli (pnpm build:cli in gopdf-cli repo).`,
      );
    }
    return resolveExistingPath(resolved);
  }

  try {
    const whichCmd =
      process.platform === "win32" ? WHERE_COMMAND_WIN : WHICH_COMMAND_UNIX;
    const stdout = execSync(whichCmd, { encoding: "utf8" }).trim();
    const firstLine = stdout.split(/\r?\n/)[0]?.trim();
    if (firstLine) {
      const resolved = resolveExistingPath(firstLine);
      if (!resolved.endsWith(TS_EXTENSION)) {
        return resolved;
      }
    }
  } catch {
    // `which` / `where` unavailable or binary not on PATH — try fallbacks below.
  }

  const argvBinary = process.argv[1];
  if (argvBinary) {
    return resolveFromArgvBinary(argvBinary);
  }

  return WHICH_COMMAND;
}
