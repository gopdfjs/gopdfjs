import type { RedactPatternKey } from "./types";

export type RedactPatternDef = {
  key: RedactPatternKey;
  label: string;
  regex: RegExp;
};

/** Built-in sensitive-data patterns for search-and-redact. */
export const REDACT_PATTERNS: Record<RedactPatternKey, RedactPatternDef> = {
  ssn: {
    key: "ssn",
    label: "SSN",
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
  },
  creditCard: {
    key: "creditCard",
    label: "Credit card",
    regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
  },
  email: {
    key: "email",
    label: "Email",
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  },
};

export function matchAllPatterns(text: string, keys: RedactPatternKey[]): RegExpMatchArray[] {
  const matches: RegExpMatchArray[] = [];
  for (const key of keys) {
    const { regex } = REDACT_PATTERNS[key];
    regex.lastIndex = 0;
    for (const m of text.matchAll(regex)) {
      if (m.index !== undefined) matches.push(m);
    }
  }
  return matches;
}
