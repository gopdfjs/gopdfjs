import os from "node:os";
import type { AgentId, AgentDefinition, ListedAgent } from "../types.ts";
import { claudeDesktopAgent } from "./claude-desktop.ts";
import { cursorAgent } from "./cursor.ts";
import { claudeCodeAgent } from "./claude-code.ts";
import { windsurfAgent } from "./windsurf.ts";

export const AGENT_DEFINITIONS: readonly AgentDefinition[] = [
  claudeDesktopAgent,
  cursorAgent,
  claudeCodeAgent,
  windsurfAgent,
];

const ALIAS_TO_ID = new Map<string, AgentId>(
  AGENT_DEFINITIONS.flatMap((agent) =>
    agent.aliases.map((alias) => [alias, agent.id] as const),
  ),
);

/** Resolve a CLI token (id or alias) to a canonical {@link AgentId}. */
export function resolveAgentId(input: string): AgentId | null {
  const normalized = input.trim().toLowerCase();
  const byId = AGENT_DEFINITIONS.find((agent) => agent.id === normalized);
  if (byId) {
    return byId.id;
  }
  return ALIAS_TO_ID.get(normalized) ?? null;
}

/** Lookup agent definition by canonical id. */
export function getAgentDefinition(id: AgentId): AgentDefinition {
  const agent = AGENT_DEFINITIONS.find((entry) => entry.id === id);
  if (!agent) {
    throw new Error(`Unknown agent: ${id}`);
  }
  return agent;
}

/** Default homedir helper for tests. */
export function defaultHomedir(): string {
  return os.homedir();
}

export { claudeDesktopAgent } from "./claude-desktop.ts";
export { cursorAgent } from "./cursor.ts";
export { claudeCodeAgent } from "./claude-code.ts";
export { windsurfAgent } from "./windsurf.ts";
