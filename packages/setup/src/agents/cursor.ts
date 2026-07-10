import path from "node:path";
import { buildGopdfServerEntry } from "../mergeMcpConfig";
import type { AgentDefinition } from "../types";

const CURSOR_USER_REL = ".cursor/mcp.json" as const;
const CURSOR_PROJECT_REL = ".cursor/mcp.json" as const;

/** Cursor — user or project `.cursor/mcp.json` with stdio type. */
export const cursorAgent: AgentDefinition = {
  id: "cursor",
  displayName: "Cursor",
  aliases: [],
  supportedScopes: ["user", "project"],
  defaultScope: "user",
  restartHint: "Restart Cursor (or reload the window) to load the MCP server.",
  resolveConfigPath: ({ scope, cwd, homedir }) =>
    scope === "project"
      ? path.join(cwd, CURSOR_PROJECT_REL)
      : path.join(homedir, CURSOR_USER_REL),
  buildServerEntry: (command) =>
    buildGopdfServerEntry(command, { includeStdioType: true }),
};
