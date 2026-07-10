import { describe, expect, it } from "vitest";
import {
  createBrowserAdapter,
  createBrowserCanvasPort,
  createBrowserEngine,
  createBrowserPdfJsRuntime,
  createBrowserRuntime,
} from "../index";

describe("@gopdfjs/adapter-browser exports", () => {
  it("exports browser adapter factories", () => {
    expect(typeof createBrowserAdapter).toBe("function");
    expect(typeof createBrowserRuntime).toBe("function");
    expect(typeof createBrowserEngine).toBe("function");
    expect(typeof createBrowserCanvasPort).toBe("function");
    expect(typeof createBrowserPdfJsRuntime).toBe("function");
  });
});
