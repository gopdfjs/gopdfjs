import { describe, expect, it } from "vitest";
import { matchAllPatterns, REDACT_PATTERNS } from "../patterns";

describe("REDACT_PATTERNS", () => {
  it("matches SSN", () => {
    const hits = matchAllPatterns("Contact 123-45-6789 today", ["ssn"]);
    expect(hits).toHaveLength(1);
    expect(hits[0]![0]).toBe("123-45-6789");
  });

  it("matches credit card with spaces", () => {
    const hits = matchAllPatterns("Card 4111 1111 1111 1111", ["creditCard"]);
    expect(hits).toHaveLength(1);
  });

  it("matches email", () => {
    const hits = matchAllPatterns("Email user@example.com end", ["email"]);
    expect(hits).toHaveLength(1);
    expect(hits[0]![0]).toBe("user@example.com");
  });

  it("exposes all pattern keys", () => {
    expect(Object.keys(REDACT_PATTERNS).sort()).toEqual(["creditCard", "email", "ssn"]);
  });
});
