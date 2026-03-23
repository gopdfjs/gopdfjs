import { describe, expect, it } from "vitest";
import { joinLocalePath } from "./locale-path";

describe("joinLocalePath", () => {
  it("maps root href to locale home", () => {
    expect(joinLocalePath("en-US", "/")).toBe("/en-US");
  });

  it("preserves nested paths", () => {
    expect(joinLocalePath("zh-CN", "/tools/merge")).toBe("/zh-CN/tools/merge");
  });

  it("normalizes href without leading slash", () => {
    expect(joinLocalePath("ja", "pricing")).toBe("/ja/pricing");
  });
});
