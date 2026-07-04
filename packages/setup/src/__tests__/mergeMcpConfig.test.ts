import { describe, expect, it } from "vitest";
import { MCP_ARGS, SERVER_NAME } from "../constants.ts";
import { buildGopdfServerEntry, mergeMcpConfig } from "../mergeMcpConfig.ts";

describe("mergeMcpConfig", () => {
  it("creates mcpServers when config is empty", () => {
    const entry = buildGopdfServerEntry("/usr/local/bin/gopdf");
    const merged = mergeMcpConfig(null, entry);

    expect(merged.mcpServers?.[SERVER_NAME]).toEqual({
      command: "/usr/local/bin/gopdf",
      args: [...MCP_ARGS],
    });
  });

  it("preserves existing servers", () => {
    const existing = {
      mcpServers: {
        other: { command: "other-tool", args: ["serve"] },
        [SERVER_NAME]: { command: "old-gopdf", args: ["legacy"] },
      },
      preferences: { theme: "dark" },
    };

    const entry = buildGopdfServerEntry("/opt/gopdf", { includeStdioType: true });
    const merged = mergeMcpConfig(existing, entry);

    expect(merged.preferences).toEqual({ theme: "dark" });
    expect(merged.mcpServers?.other).toEqual({
      command: "other-tool",
      args: ["serve"],
    });
    expect(merged.mcpServers?.[SERVER_NAME]).toEqual({
      command: "/opt/gopdf",
      args: [...MCP_ARGS],
      type: "stdio",
    });
  });

  it("includes stdio type when requested", () => {
    const entry = buildGopdfServerEntry("gopdf", { includeStdioType: true });
    expect(entry.type).toBe("stdio");
  });
});
