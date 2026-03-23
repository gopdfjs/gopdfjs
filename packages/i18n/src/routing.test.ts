import { describe, expect, it } from "vitest";
import { locales } from "./locales";
import { routing } from "./routing.core";

const DEFAULT_LOCALE = "en-US";

describe("@gopdfjs/i18n locales", () => {
  it("includes the default locale used by routing", () => {
    expect(locales).toContain(DEFAULT_LOCALE);
  });

  it("does not contain duplicates", () => {
    expect(new Set(locales).size).toBe(locales.length);
  });

  it("lists locales in stable BCP-47 style segments", () => {
    for (const loc of locales) {
      expect(loc).toMatch(/^[a-z]{2,3}(-[A-Z]{2})?$/u);
    }
  });
});

describe("@gopdfjs/i18n routing", () => {
  it("uses en-US as defaultLocale", () => {
    expect(routing.defaultLocale).toBe(DEFAULT_LOCALE);
  });

  it("exposes the same locale list as locales export", () => {
    expect([...routing.locales].sort()).toEqual([...locales].sort());
  });
});
