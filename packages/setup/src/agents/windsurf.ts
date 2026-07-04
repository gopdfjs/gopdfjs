import path from "node:path";
import { buildGopdfServerEntry } from "../mergeMcpConfig.ts";
import type { AgentDefinition } from "../types.ts";

const WINDSURF_USER_REL = ".codeium/windsurf/mcp_config.json" as const;

/** Windsurf — user-scope Codeium MCP config path. */
export const windsurfAgent: AgentDefinition = {
  id: "windsurf",
  displayName: "Windsurf",
  aliases: [],
  supportedScopes: ["user"],
  defaultScope: "user",
  restartHint: "Restart Windsurf to load the MCP server.",
  resolveConfigPath: ({ homedir }) => path.join(homedir, WINDSURF_USER_REL),
  buildServerEntry: (command) => buildGopdfServerEntry(command),
};
