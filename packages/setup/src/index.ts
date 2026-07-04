export type {
  AgentDefinition,
  AgentId,
  AgentPathContext,
  InstallResult,
  InstallScope,
  ListedAgent,
} from "./types.ts";

export { SERVER_NAME, MCP_ARGS, JSON_INDENT } from "./constants.ts";

export {
  buildGopdfServerEntry,
  formatMcpConfig,
  mergeMcpConfig,
  type McpConfig,
  type McpServerEntry,
} from "./mergeMcpConfig.ts";

export { resolveGopdfCommand } from "./resolveGopdfCommand.ts";

export {
  AGENT_DEFINITIONS,
  defaultHomedir,
  getAgentDefinition,
  resolveAgentId,
  claudeDesktopAgent,
  cursorAgent,
  claudeCodeAgent,
  windsurfAgent,
} from "./agents/index.ts";

export { listAgents, listUserScopeAgents, type ListAgentsOptions } from "./listAgents.ts";

export {
  installMcpForAgent,
  installMcpForAllUserAgents,
  type InstallMcpOptions,
} from "./installAgent.ts";
