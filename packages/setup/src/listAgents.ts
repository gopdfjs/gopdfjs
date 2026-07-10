import type { InstallScope, ListedAgent } from "./types";
import {
  AGENT_DEFINITIONS,
  defaultHomedir,
} from "./agents/index";

export type ListAgentsOptions = {
  cwd?: string;
  homedir?: string;
};

/** List supported agents and their config file paths per scope. */
export function listAgents(options: ListAgentsOptions = {}): ListedAgent[] {
  const cwd = options.cwd ?? process.cwd();
  const homedir = options.homedir ?? defaultHomedir();

  return AGENT_DEFINITIONS.map((agent) => ({
    id: agent.id,
    displayName: agent.displayName,
    aliases: agent.aliases,
    defaultScope: agent.defaultScope,
    supportedScopes: agent.supportedScopes,
    scopes: agent.supportedScopes.map((scope) => {
      const configPath = agent.resolveConfigPath({ scope, cwd, homedir });
      const note =
        configPath === null ? agent.unavailableNote : undefined;
      return { scope, configPath, note };
    }),
  }));
}

/** User-scope agents suitable for `gopdf install --all`. */
export function listUserScopeAgents(
  options: ListAgentsOptions = {},
): ListedAgent[] {
  return listAgents(options).filter((agent) =>
    agent.supportedScopes.includes("user" satisfies InstallScope),
  );
}
