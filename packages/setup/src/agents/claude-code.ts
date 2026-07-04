import path from "node:path";
import { buildGopdfServerEntry } from "../mergeMcpConfig.ts";
import type { AgentDefinition } from "../types.ts";

const CLAUDE_CODE_PROJECT_REL = ".mcp.json" as const;

/** Claude Code / generic project `.mcp.json`. */
export const claudeCodeAgent: AgentDefinition = {
  id: "claude-code",
  displayName: "Claude Code",
  aliases: ["code"],
  supportedScopes: ["project"],
  defaultScope: "project",
  restartHint: "Restart Claude Code or reload the project to pick up MCP changes.",
  resolveConfigPath: ({ scope, cwd }) =>
    scope === "project" ? path.join(cwd, CLAUDE_CODE_PROJECT_REL) : null,
  unavailableNote:
    "Claude Code MCP config is project-scoped only — use --project or run from a project directory.",
  buildServerEntry: (command) =>
    buildGopdfServerEntry(command, { includeStdioType: true }),
};
