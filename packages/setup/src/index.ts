export type {
  AgentDefinition,
  AgentId,
  AgentPathContext,
  InstallResult,
  InstallScope,
  ListedAgent,
} from "./types";

export { SERVER_NAME, MCP_ARGS, JSON_INDENT } from "./constants";

export {
  buildGopdfServerEntry,
  formatMcpConfig,
  mergeMcpConfig,
  type McpConfig,
  type McpServerEntry,
} from "./mergeMcpConfig";

export { resolveGopdfCommand } from "./resolveGopdfCommand";

export {
  AGENT_DEFINITIONS,
  defaultHomedir,
  getAgentDefinition,
  resolveAgentId,
  claudeDesktopAgent,
  cursorAgent,
  claudeCodeAgent,
  windsurfAgent,
} from "./agents/index";

export { listAgents, listUserScopeAgents, type ListAgentsOptions } from "./listAgents";

export {
  installMcpForAgent,
  installMcpForAllUserAgents,
  type InstallMcpOptions,
} from "./installAgent";
