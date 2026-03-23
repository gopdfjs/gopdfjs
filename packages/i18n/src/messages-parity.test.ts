import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { locales } from "./locales";

/** Monorepo root: packages/i18n/src -> ../../../ */
const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
);
const MESSAGES_DIR = path.join(REPO_ROOT, "site", "messages");

/**
 * Collect dot-paths for every string leaf (nested objects only; no arrays in messages).
 */
function collectStringLeaves(
  obj: unknown,
  prefix = "",
): Map<string, string> {
  const out = new Map<string, string>();
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    return out;
  }
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") {
      out.set(p, v);
    } else if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      for (const [kp, vp] of collectStringLeaves(v, p)) {
        out.set(kp, vp);
      }
    }
  }
  return out;
}

/**
 * ICU / message placeholders: leading `{name,` or `{name}` (same set as English required in translations).
 */
function placeholderNames(s: string): Set<string> {
  const set = new Set<string>();
  const re = /\{([a-zA-Z_][a-zA-Z0-9_]*)(?:,|})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    set.add(m[1]);
  }
  return set;
}

function readMessagesJson(fileName: string): unknown {
  const full = path.join(MESSAGES_DIR, fileName);
  const raw = fs.readFileSync(full, "utf8");
  return JSON.parse(raw) as unknown;
}

/** Keys whose translated values must still contain these literal fragments (app replaces tokens). */
const CRITICAL_SUBSTRINGS: Record<string, readonly string[]> = {
  "ToolPages.headerFooter.tokensLine": ["{pageToken}", "{totalToken}"],
  "ToolPages.headerFooter.footerPlaceholder": ["{pageToken}", "{totalToken}"],
  "ToolPages.headerFooter.defaultFooterForPdf": ["{pageToken}", "{totalToken}"],
};

describe("site/messages parity with en-US.json", () => {
  it("resolves messages directory", () => {
    expect(fs.existsSync(MESSAGES_DIR)).toBe(true);
    expect(fs.existsSync(path.join(MESSAGES_DIR, "en-US.json"))).toBe(true);
  });

  it("has a JSON file for every configured locale", () => {
    for (const loc of locales) {
      const file = path.join(MESSAGES_DIR, `${loc}.json`);
      expect(fs.existsSync(file), `missing messages/${loc}.json`).toBe(true);
    }
  });

  it("matches string leaf paths and ICU placeholder names for each locale vs en-US", () => {
    const enLeaves = collectStringLeaves(readMessagesJson("en-US.json"));
    expect(enLeaves.size).toBeGreaterThan(10);

    for (const loc of locales) {
      if (loc === "en-US") continue;

      const locLeaves = collectStringLeaves(readMessagesJson(`${loc}.json`));
      const enPaths = new Set(enLeaves.keys());
      const lp = new Set(locLeaves.keys());

      expect(
        lp,
        `${loc}: leaf paths should equal en-US (missing or extra keys)`,
      ).toEqual(enPaths);

      for (const [dotPath, enVal] of enLeaves) {
        const translated = locLeaves.get(dotPath);
        expect(translated, `${loc} missing ${dotPath}`).toBeDefined();
        const t = translated!;
        expect(t.trim().length, `${loc} empty string at ${dotPath}`).toBeGreaterThan(0);

        expect(
          placeholderNames(t),
          `${loc} placeholder set mismatch at ${dotPath}`,
        ).toEqual(placeholderNames(enVal));
      }
    }
  });

  it("preserves critical header/footer token substrings in every locale", () => {
    for (const loc of locales) {
      if (loc === "en-US") continue;
      const leaves = collectStringLeaves(readMessagesJson(`${loc}.json`));
      for (const [dotPath, needles] of Object.entries(CRITICAL_SUBSTRINGS)) {
        const val = leaves.get(dotPath);
        expect(val, `${loc} missing ${dotPath}`).toBeDefined();
        for (const needle of needles) {
          expect(
            val!,
            `${loc} ${dotPath} must include ${needle}`,
          ).toContain(needle);
        }
      }
    }
  });
});
