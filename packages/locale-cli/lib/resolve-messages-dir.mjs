/**
 * Resolves the messages directory for sync/prune.
 * Priority: MESSAGES_DIR env → --messages-dir=PATH → ./messages relative to cwd.
 */
import path from "node:path";

/**
 * @param {string[]} [argv]
 * @param {NodeJS.ProcessEnv} [env]
 */
export function resolveMessagesDir(argv = process.argv, env = process.env) {
  const fromEnv = env.MESSAGES_DIR;
  if (fromEnv && String(fromEnv).trim() !== "") {
    return path.resolve(String(fromEnv));
  }
  const arg = argv.find((a) => a.startsWith("--messages-dir="));
  if (arg) {
    return path.resolve(arg.slice("--messages-dir=".length));
  }
  return path.resolve(process.cwd(), "messages");
}
