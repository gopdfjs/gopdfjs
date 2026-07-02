import { describe, expect, it } from "vitest";
import { isAppLocale, messagesFileName, MESSAGES_DIR } from "./messages";
import { locales } from "./locales";

describe("messages helpers", () => {
  it("exposes canonical messages directory path", () => {
    expect(MESSAGES_DIR).toBe("site/messages");
  });

  it("maps locale to JSON file name", () => {
    expect(messagesFileName("en-US")).toBe("en-US.json");
  });

  it("narrows string to AppLocale", () => {
    expect(isAppLocale("de")).toBe(true);
    expect(isAppLocale("xx")).toBe(false);
    expect(locales.every(isAppLocale)).toBe(true);
  });
});
