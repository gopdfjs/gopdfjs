import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/** Monorepo root: packages/i18n/src -> ../../../ */
const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
);

const LOCALE_CLI = path.join(
  REPO_ROOT,
  "packages",
  "locale-cli",
  "bin",
  "gopdf-locale.mjs",
);

describe("RFC 0005 — next-intl messages (gopdf-locale check)", () => {
  it("passes parity, ICU placeholders, and @gopdfjs/ui key coverage", () => {
    const out = execFileSync(process.execPath, [LOCALE_CLI, "check"], {
      cwd: REPO_ROOT,
      encoding: "utf8",
    });
    expect(out).toMatch(/gopdf-locale check passed/u);
  });
});
