import { describe, expect, it } from "vitest";
import { createBrowserAdapter, createBrowserRuntime } from "../index";

describe("@gopdfjs/adapter-browser public exports", () => {
  it("exports only host adapter entrypoints", () => {
    expect(typeof createBrowserAdapter).toBe("function");
    expect(typeof createBrowserRuntime).toBe("function");
  });
});
