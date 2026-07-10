import { describe, expect, it } from "vitest";
import {
  createNodeAdapter,
  createNodeCanvasPort,
  createNodeEngine,
  createNodeOcrPort,
  createNodePdfJsRuntime,
  createNodeRuntime,
} from "../index";

describe("@gopdfjs/adapter-node exports", () => {
  it("exports node adapter factories", () => {
    expect(typeof createNodeAdapter).toBe("function");
    expect(typeof createNodeRuntime).toBe("function");
    expect(typeof createNodeEngine).toBe("function");
    expect(typeof createNodeCanvasPort).toBe("function");
    expect(typeof createNodePdfJsRuntime).toBe("function");
    expect(typeof createNodeOcrPort).toBe("function");
  });
});
