import { describe, expect, it } from "vitest";
import { createNodeAdapter, createNodeRuntime } from "../index";

describe("@gopdfjs/adapter-node public exports", () => {
  it("exports only host adapter entrypoints", () => {
    expect(typeof createNodeAdapter).toBe("function");
    expect(typeof createNodeRuntime).toBe("function");
  });
});
