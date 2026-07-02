import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { missingLocaleLabels, scanUiTranslationKeys } from "../lib/ui-keys.mjs";

test("missingLocaleLabels accepts quoted and bare object keys", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gopdf-locale-labels-"));
  try {
    const labelsTs = path.join(dir, "locale-labels.ts");
    fs.writeFileSync(
      labelsTs,
      `export const localeLabels = {
  "zh-CN": "简",
  ja: "日本語",
  fr: "Français",
};\n`,
      "utf8",
    );
    assert.deepEqual(
      missingLocaleLabels(labelsTs, ["zh-CN", "ja", "fr", "de"]),
      ["de"],
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("scanUiTranslationKeys finds useTranslations and data-driven keys", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gopdf-ui-keys-"));
  try {
    const uiSrc = path.join(dir, "src");
    fs.mkdirSync(uiSrc, { recursive: true });
    fs.writeFileSync(
      path.join(uiSrc, "Header.tsx"),
      `
const toolGroups = [
  { groupKey: "convert", tools: [{ nameKey: "merge" }] },
];
export default function Header() {
  const t = useTranslations("Navigation");
  const tTools = useTranslations("Tools");
  return t("allTools") + tTools("merge");
}
`,
      "utf8",
    );

    const { keys } = scanUiTranslationKeys(uiSrc);
    assert.ok(keys.has("Navigation.allTools"));
    assert.ok(keys.has("NavGroups.convert"));
    assert.ok(keys.has("Tools.merge"));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
