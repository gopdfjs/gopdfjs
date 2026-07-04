import { execSync } from "node:child_process";
import { realpathSync } from "node:fs";
import path from "node:path";

const WHICH_COMMAND = "gopdf" as const;
const WHERE_COMMAND_WIN = "where gopdf" as const;
const WHICH_COMMAND_UNIX = "which gopdf" as const;

/**
 * Resolve the absolute path to the `gopdf` binary.
 * Falls back to `process.argv[1]` when invoked via the CLI, then bare `gopdf`.
 */
export function resolveGopdfCommand(commandPath?: string): string {
  if (commandPath) {
    return path.resolve(commandPath);
  }

  try {
    const whichCmd =
      process.platform === "win32" ? WHERE_COMMAND_WIN : WHICH_COMMAND_UNIX;
    const stdout = execSync(whichCmd, { encoding: "utf8" }).trim();
    const firstLine = stdout.split(/\r?\n/)[0]?.trim();
    if (firstLine) {
      return realpathSync(firstLine);
    }
  } catch {
    // `which` / `where` unavailable or binary not on PATH — try fallbacks below.
  }

  const argvBinary = process.argv[1];
  if (argvBinary) {
    try {
      return realpathSync(argvBinary);
    } catch {
      return path.resolve(argvBinary);
    }
  }

  return WHICH_COMMAND;
}
