import { describe, expect, it } from "vitest";
import { runCli } from "./cli.ts";

describe("gopdf cli router", () => {
  it("prints help", async () => {
    expect(await runCli(["--help"])).toBe(0);
  });

  it("rejects unknown command", async () => {
    expect(await runCli(["nope"])).toBe(1);
  });
});
