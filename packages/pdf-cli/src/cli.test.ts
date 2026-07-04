import { describe, expect, it, vi, afterEach } from "vitest";
import { runCli } from "./cli.ts";
import { BUY_ME_A_COFFEE_URL } from "./constants.ts";
import {
  printWelcomeMessage,
  shouldShowWelcomeMessage,
} from "./welcome.ts";

describe("welcome message", () => {
  describe("shouldShowWelcomeMessage", () => {
    it("returns true for help invocations", () => {
      expect(shouldShowWelcomeMessage([])).toBe(true);
      expect(shouldShowWelcomeMessage(["help"])).toBe(true);
      expect(shouldShowWelcomeMessage(["--help"])).toBe(true);
      expect(shouldShowWelcomeMessage(["-h"])).toBe(true);
    });

    it("returns false for tool commands and --json", () => {
      expect(shouldShowWelcomeMessage(["compress"])).toBe(false);
      expect(shouldShowWelcomeMessage(["--help", "--json"])).toBe(false);
    });
  });

  it("printWelcomeMessage writes thanks and link", () => {
    const lines: string[] = [];
    printWelcomeMessage((msg) => lines.push(msg));
    const output = lines.join("");
    expect(output).toContain("buy me a coffee");
    expect(output).toContain(BUY_ME_A_COFFEE_URL);
  });
});

describe("gopdf cli router", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prints welcome on help", async () => {
    const stderr = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await runCli(["--help"])).toBe(0);
    expect(stderr).toHaveBeenCalledWith(
      expect.stringContaining(BUY_ME_A_COFFEE_URL),
    );
  });

  it("prints help", async () => {
    expect(await runCli(["--help"])).toBe(0);
  });

  it("skips welcome for unknown command", async () => {
    const stderr = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await runCli(["nope"])).toBe(1);
    const welcomeCall = stderr.mock.calls.find(([msg]) =>
      String(msg).includes("buy me a coffee"),
    );
    expect(welcomeCall).toBeUndefined();
  });

  it("skips welcome for tool commands", async () => {
    const stderr = vi.spyOn(console, "error").mockImplementation(() => {});
    await runCli(["compress"]);
    const welcomeCall = stderr.mock.calls.find(([msg]) =>
      String(msg).includes("buy me a coffee"),
    );
    expect(welcomeCall).toBeUndefined();
  });

  it("rejects unknown command", async () => {
    expect(await runCli(["nope"])).toBe(1);
  });
});
