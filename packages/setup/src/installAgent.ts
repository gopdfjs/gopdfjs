import fs from "node:fs/promises";
import path from "node:path";
import type { AgentId, InstallResult, InstallScope } from "./types";
import {
  defaultHomedir,
  getAgentDefinition,
  resolveAgentId,
} from "./agents/index";
import {
  formatMcpConfig,
  mergeMcpConfig,
  type McpConfig,
} from "./mergeMcpConfig";
import { resolveGopdfCommand } from "./resolveGopdfCommand";

export type InstallMcpOptions = {
  agent: AgentId | string;
  scope?: InstallScope;
  cwd?: string;
  homedir?: string;
  dryRun?: boolean;
  commandPath?: string;
};

async function readExistingConfig(configPath: string): Promise<McpConfig | null> {
  try {
    const raw = await fs.readFile(configPath, "utf8");
    return JSON.parse(raw) as McpConfig;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function writeConfig(configPath: string, config: McpConfig): Promise<void> {
  await fs.mkdir(path.dirname(configPath), { recursive: true });
  await fs.writeFile(configPath, formatMcpConfig(config), "utf8");
}

/**
 * Install or merge the gopdf MCP server entry for a supported AI agent host.
 */
export async function installMcpForAgent(
  options: InstallMcpOptions,
): Promise<InstallResult> {
  const resolvedId =
    typeof options.agent === "string"
      ? resolveAgentId(options.agent)
      : options.agent;

  if (!resolvedId) {
    throw new Error(`Unknown agent: ${options.agent}`);
  }

  const definition = getAgentDefinition(resolvedId);
  const cwd = options.cwd ?? process.cwd();
  const homedir = options.homedir ?? defaultHomedir();
  const scope = options.scope ?? definition.defaultScope;
  const dryRun = options.dryRun ?? false;

  if (!definition.supportedScopes.includes(scope)) {
    return {
      success: false,
      agent: definition.id,
      scope,
      configPath: "",
      dryRun,
      skipped: true,
      note:
        definition.unavailableNote ??
        `${definition.displayName} does not support ${scope} scope.`,
    };
  }

  const configPath = definition.resolveConfigPath({ scope, cwd, homedir });
  if (!configPath) {
    return {
      success: false,
      agent: definition.id,
      scope,
      configPath: "",
      dryRun,
      skipped: true,
      note:
        definition.unavailableNote ??
        `No config path for ${definition.displayName} on this platform.`,
    };
  }

  const command = resolveGopdfCommand(options.commandPath);
  const serverEntry = definition.buildServerEntry(command);
  const existing = await readExistingConfig(configPath);
  const merged = mergeMcpConfig(existing, serverEntry);

  if (!dryRun) {
    await writeConfig(configPath, merged);
  }

  return {
    success: true,
    agent: definition.id,
    scope,
    configPath,
    dryRun,
    config: merged,
  };
}

/** Install gopdf MCP for every user-scope agent. */
export async function installMcpForAllUserAgents(
  options: Omit<InstallMcpOptions, "agent"> = {},
): Promise<InstallResult[]> {
  const { listUserScopeAgents } = await import("./listAgents.ts");
  const agents = listUserScopeAgents({
    cwd: options.cwd,
    homedir: options.homedir,
  });

  const results: InstallResult[] = [];
  for (const agent of agents) {
    results.push(
      await installMcpForAgent({
        ...options,
        agent: agent.id,
        scope: "user",
      }),
    );
  }
  return results;
}

export { getAgentDefinition, resolveAgentId };
