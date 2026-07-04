import { describe, expect, it } from "vitest";
import { parseInstallArgv } from "./commands/install.ts";

describe("gopdf install argv parser", () => {
  it("parses agent and flags", () => {
    expect(parseInstallArgv(["cursor", "--project", "--dry-run"])).toEqual({
      agent: "cursor",
      project: true,
      dryRun: true,
      all: false,
    });
  });

  it("parses --all", () => {
    expect(parseInstallArgv(["--all"])).toEqual({
      agent: undefined,
      project: false,
      dryRun: false,
      all: true,
    });
  });

  it("rejects --all with agent", () => {
    expect(parseInstallArgv(["claude", "--all"])).toBeNull();
  });
});
