import path from "node:path";
import { buildGopdfServerEntry } from "../mergeMcpConfig";
import type { AgentDefinition } from "../types";

const CLAUDE_DESKTOP_DIR_DARWIN = "Library/Application Support/Claude" as const;
const CLAUDE_DESKTOP_DIR_WIN = "Claude" as const;
const CLAUDE_DESKTOP_DIR_LINUX = ".config/Claude" as const;
const CLAUDE_DESKTOP_FILENAME = "claude_desktop_config.json" as const;

/** Claude Desktop — user-scope only; OS-specific config directory. */
export const claudeDesktopAgent: AgentDefinition = {
  id: "claude-desktop",
  displayName: "Claude Desktop",
  aliases: ["claude"],
  supportedScopes: ["user"],
  defaultScope: "user",
  restartHint: "Restart Claude Desktop to load the MCP server.",
  resolveConfigPath: ({ homedir }) => {
    switch (process.platform) {
      case "darwin":
        return path.join(homedir, CLAUDE_DESKTOP_DIR_DARWIN, CLAUDE_DESKTOP_FILENAME);
      case "win32": {
        const appData = process.env.APPDATA ?? path.join(homedir, "AppData", "Roaming");
        return path.join(appData, CLAUDE_DESKTOP_DIR_WIN, CLAUDE_DESKTOP_FILENAME);
      }
      case "linux":
        return path.join(homedir, CLAUDE_DESKTOP_DIR_LINUX, CLAUDE_DESKTOP_FILENAME);
      default:
        return null;
    }
  },
  unavailableNote: "Claude Desktop config path is unknown on this platform.",
  buildServerEntry: (command) => buildGopdfServerEntry(command),
};
