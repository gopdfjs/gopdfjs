import { describe, expect, it } from "vitest";
import { createBrowserAdapter, createBrowserGopdf, createBrowserRuntime } from "../index";

describe("@gopdfjs/adapter-browser public exports", () => {
  it("exports only consumer + host adapter entrypoints", () => {
    expect(typeof createBrowserGopdf).toBe("function");
    expect(typeof createBrowserAdapter).toBe("function");
    expect(typeof createBrowserRuntime).toBe("function");
  });
});
