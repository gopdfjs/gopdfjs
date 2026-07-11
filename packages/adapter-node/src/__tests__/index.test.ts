import { describe, expect, it } from "vitest";
import { createNodeAdapter, createNodeGopdf, createNodeRuntime } from "../index";

describe("@gopdfjs/adapter-node public exports", () => {
  it("exports only consumer + host adapter entrypoints", () => {
    expect(typeof createNodeGopdf).toBe("function");
    expect(typeof createNodeAdapter).toBe("function");
    expect(typeof createNodeRuntime).toBe("function");
  });
});
