import { MCP_ARGS, SERVER_NAME } from "./constants";

export type McpServerEntry = Record<string, unknown>;

export type McpConfig = {
  mcpServers?: Record<string, McpServerEntry>;
  [key: string]: unknown;
};

/** Build the gopdf MCP server block for a host config file. */
export function buildGopdfServerEntry(
  command: string,
  options?: { includeStdioType?: boolean },
): McpServerEntry {
  const entry: McpServerEntry = {
    command,
    args: [...MCP_ARGS],
  };

  if (options?.includeStdioType) {
    entry.type = "stdio";
  }

  return entry;
}

/**
 * Deep-merge `gopdf` into existing MCP config without removing other servers.
 * Top-level keys outside `mcpServers` are preserved.
 */
export function mergeMcpConfig(
  existing: McpConfig | null | undefined,
  serverEntry: McpServerEntry,
): McpConfig {
  const base: McpConfig = existing ? structuredClone(existing) : {};
  const servers = { ...(base.mcpServers ?? {}) };

  servers[SERVER_NAME] = {
    ...(servers[SERVER_NAME] ?? {}),
    ...serverEntry,
  };

  return {
    ...base,
    mcpServers: servers,
  };
}

/** Serialize MCP config with stable 2-space indentation. */
export function formatMcpConfig(config: McpConfig): string {
  return `${JSON.stringify(config, null, 2)}\n`;
}
