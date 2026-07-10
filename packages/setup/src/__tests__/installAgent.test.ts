import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { MCP_ARGS, SERVER_NAME } from "../constants";
import { installMcpForAgent } from "../installAgent";
import { claudeCodeAgent, cursorAgent } from "../agents/index";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })),
  );
});

async function makeTempDir(prefix: string): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

describe("installMcpForAgent", () => {
  it("dry-run returns expected merged config for cursor project scope", async () => {
    const cwd = await makeTempDir("gopdf-setup-cursor-");
    const homedir = path.join(cwd, "home");
    const commandPath = path.join(cwd, "bin", "gopdf");

    const result = await installMcpForAgent({
      agent: "cursor",
      scope: "project",
      cwd,
      homedir,
      dryRun: true,
      commandPath,
    });

    expect(result.success).toBe(true);
    expect(result.dryRun).toBe(true);
    expect(result.configPath).toBe(path.join(cwd, ".cursor", "mcp.json"));
    expect(result.config?.mcpServers?.[SERVER_NAME]).toEqual({
      command: commandPath,
      args: [...MCP_ARGS],
      type: "stdio",
    });

    await expect(fs.stat(result.configPath)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("writes claude-code project config", async () => {
    const cwd = await makeTempDir("gopdf-setup-code-");
    const commandPath = path.join(cwd, "gopdf");

    const result = await installMcpForAgent({
      agent: "code",
      scope: "project",
      cwd,
      homedir: path.join(cwd, "home"),
      commandPath,
    });

    expect(result.success).toBe(true);
    expect(result.configPath).toBe(path.join(cwd, ".mcp.json"));

    const raw = await fs.readFile(result.configPath, "utf8");
    const parsed = JSON.parse(raw) as { mcpServers: Record<string, unknown> };
    expect(parsed.mcpServers[SERVER_NAME]).toMatchObject({
      command: commandPath,
      args: [...MCP_ARGS],
      type: "stdio",
    });
  });

  it("merges without clobbering other servers", async () => {
    const cwd = await makeTempDir("gopdf-setup-merge-");
    const configPath = path.join(cwd, ".mcp.json");
    await fs.writeFile(
      configPath,
      JSON.stringify(
        {
          mcpServers: {
            existing: { command: "keep-me", args: [] },
          },
        },
        null,
        2,
      ),
      "utf8",
    );

    await installMcpForAgent({
      agent: "claude-code",
      scope: "project",
      cwd,
      commandPath: "/bin/gopdf",
    });

    const parsed = JSON.parse(await fs.readFile(configPath, "utf8")) as {
      mcpServers: Record<string, { command: string }>;
    };
    expect(parsed.mcpServers.existing.command).toBe("keep-me");
    expect(parsed.mcpServers[SERVER_NAME].command).toBe("/bin/gopdf");
  });

  it("skips unsupported scope with note", async () => {
    const result = await installMcpForAgent({
      agent: "claude-code",
      scope: "user",
      cwd: await makeTempDir("gopdf-setup-skip-"),
      homedir: path.join(await makeTempDir("gopdf-setup-home-"), "home"),
    });

    expect(result.success).toBe(false);
    expect(result.skipped).toBe(true);
    expect(result.note).toContain("project-scoped");
  });
});

describe("agent config paths", () => {
  it("resolves cursor user and project paths", () => {
    const homedir = "/Users/test";
    const cwd = "/repo";

    expect(
      cursorAgent.resolveConfigPath({ scope: "user", cwd, homedir }),
    ).toBe(path.join(homedir, ".cursor", "mcp.json"));
    expect(
      cursorAgent.resolveConfigPath({ scope: "project", cwd, homedir }),
    ).toBe(path.join(cwd, ".cursor", "mcp.json"));
  });

  it("resolves claude-code project path only", () => {
    const cwd = "/repo";
    expect(
      claudeCodeAgent.resolveConfigPath({
        scope: "project",
        cwd,
        homedir: "/Users/test",
      }),
    ).toBe(path.join(cwd, ".mcp.json"));
    expect(
      claudeCodeAgent.resolveConfigPath({
        scope: "user",
        cwd,
        homedir: "/Users/test",
      }),
    ).toBeNull();
  });
});
