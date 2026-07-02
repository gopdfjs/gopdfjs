/**
 * Integration tests for gopdf-locale check (next-intl parity + UI keys).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { runCheck } from "../lib/check.mjs";
import { readLocalesFromTs } from "../lib/read-locales.mjs";

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function scaffoldRepo(dir) {
  const messagesDir = path.join(dir, "site", "messages");
  const uiSrc = path.join(dir, "packages", "ui", "src");
  const localesTs = path.join(dir, "packages", "i18n", "src", "locales.ts");
  const localeLabelsTs = path.join(
    dir,
    "packages",
    "i18n",
    "src",
    "locale-labels.ts",
  );

  fs.mkdirSync(messagesDir, { recursive: true });
  fs.mkdirSync(uiSrc, { recursive: true });
  fs.mkdirSync(path.dirname(localesTs), { recursive: true });

  writeJson(path.join(messagesDir, "en-US.json"), {
    Metadata: { siteTitle: "T", siteDescription: "D" },
    Navigation: { allTools: "Tools", signout: "Out" },
    NavGroups: { convert: "Convert", edit: "Edit" },
    Tools: { compress: "Compress", merge: "Merge" },
    ToolShell: { backToTools: "Back", privacyFooter: "Private" },
    ToolPages: {
      headerFooter: {
        tokensLine: "Page {pageToken} of {totalToken}",
        footerPlaceholder: "{pageToken} / {totalToken}",
        defaultFooterForPdf: "{pageToken} of {totalToken}",
      },
    },
  });
  writeJson(path.join(messagesDir, "de.json"), {
    Metadata: { siteTitle: "T DE", siteDescription: "D DE" },
    Navigation: { allTools: "Tools DE", signout: "Out DE" },
    NavGroups: { convert: "Convert DE", edit: "Edit DE" },
    Tools: { compress: "Compress DE", merge: "Merge DE" },
    ToolShell: { backToTools: "Back DE", privacyFooter: "Private DE" },
    ToolPages: {
      headerFooter: {
        tokensLine: "Seite {pageToken} von {totalToken}",
        footerPlaceholder: "{pageToken} / {totalToken}",
        defaultFooterForPdf: "{pageToken} von {totalToken}",
      },
    },
  });

  fs.writeFileSync(
    localesTs,
    `export const locales = ["en-US", "de"] as const;\nexport type AppLocale = (typeof locales)[number];\n`,
    "utf8",
  );

  fs.writeFileSync(
    localeLabelsTs,
    `export const localeLabels = { "en-US": "English", "de": "Deutsch" };\n`,
    "utf8",
  );

  fs.writeFileSync(
    path.join(uiSrc, "Header.tsx"),
    `import { useTranslations } from "use-intl";
const toolGroups = [{ groupKey: "convert", tools: [{ nameKey: "compress" }, { nameKey: "merge" }] }];
export default function Header() {
  const t = useTranslations("Navigation");
  t("allTools");
  t("signout");
}
`,
    "utf8",
  );

  fs.writeFileSync(
    path.join(uiSrc, "ToolShell.tsx"),
    `import { useTranslations } from "use-intl";
export default function ToolShell() {
  const t = useTranslations("ToolShell");
  t("backToTools");
  t("privacyFooter");
}
`,
    "utf8",
  );

  return { messagesDir, localesTs, localeLabelsTs, uiSrc };
}

test("runCheck passes on minimal valid next-intl corpus", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gopdf-locale-check-"));
  try {
    const { messagesDir, localesTs, localeLabelsTs, uiSrc } = scaffoldRepo(dir);
    const result = runCheck({
      repoRoot: dir,
      messagesDir,
      localesTsPath: localesTs,
      localeLabelsTsPath: localeLabelsTs,
      uiSrcDir: uiSrc,
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.deepEqual(readLocalesFromTs(localesTs), result.locales);
      assert.ok(result.uiKeyCount >= 5);
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("runCheck fails when en-US missing a UI key", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gopdf-locale-check-"));
  try {
    const { messagesDir, localesTs, localeLabelsTs, uiSrc } = scaffoldRepo(dir);
    const enPath = path.join(messagesDir, "en-US.json");
    const en = JSON.parse(fs.readFileSync(enPath, "utf8"));
    delete en.ToolShell;
    writeJson(enPath, en);

    const result = runCheck({
      repoRoot: dir,
      messagesDir,
      localesTsPath: localesTs,
      localeLabelsTsPath: localeLabelsTs,
      uiSrcDir: uiSrc,
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.ok(
        result.errors.some((e) => e.includes("ToolShell.backToTools")),
      );
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("runCheck fails on ICU placeholder mismatch", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gopdf-locale-check-"));
  try {
    const { messagesDir, localesTs, localeLabelsTs, uiSrc } = scaffoldRepo(dir);
    const dePath = path.join(messagesDir, "de.json");
    const de = JSON.parse(fs.readFileSync(dePath, "utf8"));
    de.ToolPages.headerFooter.tokensLine = "no placeholders";
    writeJson(dePath, de);

    const result = runCheck({
      repoRoot: dir,
      messagesDir,
      localesTsPath: localesTs,
      localeLabelsTsPath: localeLabelsTs,
      uiSrcDir: uiSrc,
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.ok(result.errors.some((e) => e.includes("placeholder mismatch")));
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
