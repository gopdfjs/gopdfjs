/** Supported AI agent host identifiers. */
export type AgentId = "claude-desktop" | "cursor" | "claude-code" | "windsurf";

/** Whether to write user-global or project-local MCP config. */
export type InstallScope = "user" | "project";

/** Outcome of an MCP install attempt. */
export type InstallResult = {
  success: boolean;
  agent: AgentId;
  scope: InstallScope;
  configPath: string;
  dryRun: boolean;
  skipped?: boolean;
  note?: string;
  /** Merged config written (or would be written) when not skipped. */
  config?: Record<string, unknown>;
};

export type AgentPathContext = {
  scope: InstallScope;
  cwd: string;
  homedir: string;
};

export type AgentDefinition = {
  id: AgentId;
  displayName: string;
  aliases: readonly string[];
  supportedScopes: readonly InstallScope[];
  defaultScope: InstallScope;
  restartHint: string;
  resolveConfigPath: (ctx: AgentPathContext) => string | null;
  buildServerEntry: (command: string) => Record<string, unknown>;
  unavailableNote?: string;
};

export type ListedAgent = {
  id: AgentId;
  displayName: string;
  aliases: readonly string[];
  defaultScope: InstallScope;
  supportedScopes: readonly InstallScope[];
  scopes: Array<{
    scope: InstallScope;
    configPath: string | null;
    note?: string;
  }>;
};
