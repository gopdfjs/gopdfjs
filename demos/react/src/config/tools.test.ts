import { describe, expect, it } from "vitest";
import { TOOL_IDS } from "./toolIds";
import { GENERIC_TOOL_ROUTES, TOOL_REGISTRY, assertToolCoverage, listE2eTools } from "./tools";

describe("tool registry", () => {
  it("covers every ToolId with a route", () => {
    expect(() => assertToolCoverage()).not.toThrow();
    expect(TOOL_REGISTRY).toHaveLength(TOOL_IDS.length);
  });

  it("lists one e2e surface per tool", () => {
    expect(listE2eTools()).toHaveLength(TOOL_IDS.length);
  });

  it("registers generic routes for non-compress tools", () => {
    expect(GENERIC_TOOL_ROUTES).toHaveLength(TOOL_IDS.length - 1);
  });

  it("uses unique paths", () => {
    const paths = TOOL_REGISTRY.map((tool) => tool.path);
    expect(new Set(paths).size).toBe(paths.length);
  });
});
