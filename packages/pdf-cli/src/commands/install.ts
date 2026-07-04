import {
  getAgentDefinition,
  installMcpForAgent,
  installMcpForAllUserAgents,
  listAgents,
  resolveAgentId,
  type InstallResult,
} from "@gopdfjs/setup";

const USAGE = `Usage: gopdf install [agent] [--project] [--dry-run] [--all]

Agents:
  claude, claude-desktop   Claude Desktop (user config)
  cursor                   Cursor MCP (user or --project)
  claude-code, code        Project .mcp.json (project scope)
  windsurf                 Windsurf user MCP config

Options:
  --project    Write project-local config (Cursor, Claude Code)
  --dry-run    Print merged config without writing
  --all        Install for all user-scope agents

Examples:
  gopdf install
  gopdf install claude
  gopdf install cursor --project
  gopdf install claude-code
  gopdf install --all
  gopdf install claude --dry-run`;

export type InstallCliOptions = {
  agent?: string;
  project: boolean;
  dryRun: boolean;
  all: boolean;
};

export function parseInstallArgv(argv: string[]): InstallCliOptions | null {
  let agent: string | undefined;
  let project = false;
  let dryRun = false;
  let all = false;

  for (const arg of argv) {
    if (arg === "--project") {
      project = true;
      continue;
    }
    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (arg === "--all") {
      all = true;
      continue;
    }
    if (arg.startsWith("-")) {
      console.error(`Unknown option: ${arg}`);
      console.log(USAGE);
      return null;
    }
    if (agent) {
      console.error(`Unexpected argument: ${arg}`);
      console.log(USAGE);
      return null;
    }
    agent = arg;
  }

  if (all && agent) {
    console.error("[ERROR] Use either --all or a specific agent, not both.");
    return null;
  }

  return { agent, project, dryRun, all };
}

function printAgentList(): void {
  const agents = listAgents();
  console.log("Supported agents:\n");
  for (const entry of agents) {
    const aliasText =
      entry.aliases.length > 0 ? ` (aliases: ${entry.aliases.join(", ")})` : "";
    console.log(`  ${entry.id}${aliasText}`);
    console.log(`    default scope: ${entry.defaultScope}`);
    for (const scopeEntry of entry.scopes) {
      const pathLabel = scopeEntry.configPath ?? "(unavailable)";
      console.log(`    ${scopeEntry.scope}: ${pathLabel}`);
      if (scopeEntry.note) {
        console.log(`      note: ${scopeEntry.note}`);
      }
    }
    console.log("");
  }
  console.log(USAGE);
}

function printInstallSuccess(result: InstallResult): void {
  const definition = getAgentDefinition(result.agent);
  if (result.skipped) {
    console.log(`[SKIP] ${definition.displayName}: ${result.note ?? "skipped"}`);
    return;
  }

  const action = result.dryRun ? "Would write" : "Wrote";
  console.log(`[OK] ${action} MCP config for ${definition.displayName}`);
  console.log(`     File: ${result.configPath}`);
  console.log(`     Scope: ${result.scope}`);
  if (result.dryRun && result.config) {
    console.log("\nMerged config preview:");
    console.log(JSON.stringify(result.config, null, 2));
  } else {
    console.log(`\n${definition.restartHint}`);
  }
}

export async function runInstall(argv: string[]): Promise<number> {
  const parsed = parseInstallArgv(argv);
  if (!parsed) {
    return 1;
  }

  const { agent, project, dryRun, all } = parsed;
  const scope = project ? "project" : undefined;

  if (!agent && !all) {
    printAgentList();
    return 0;
  }

  if (all) {
    const results = await installMcpForAllUserAgents({ dryRun, scope: "user" });
    let failures = 0;
    for (const result of results) {
      printInstallSuccess(result);
      if (!result.success && !result.skipped) {
        failures += 1;
      }
    }
    return failures > 0 ? 1 : 0;
  }

  const resolved = resolveAgentId(agent!);
  if (!resolved) {
    console.error(`[ERROR] Unknown agent: ${agent}`);
    printAgentList();
    return 1;
  }

  const result = await installMcpForAgent({
    agent: resolved,
    scope,
    dryRun,
  });

  printInstallSuccess(result);
  return result.success || result.skipped ? 0 : 1;
}

export { USAGE as INSTALL_USAGE };
