import { describe, expect, it } from "vitest";
import { locales } from "./locales";
import { localeLabels } from "./locale-labels";

describe("localeLabels", () => {
  it("has a native label for every configured locale", () => {
    for (const loc of locales) {
      expect(localeLabels[loc]?.trim().length ?? 0).toBeGreaterThan(0);
    }
  });
});
