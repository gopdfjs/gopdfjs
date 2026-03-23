/**
 * Integration tests for runSync / runPrune against a temp messages directory.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { runPrune } from "../lib/prune.mjs";
import { runSync } from "../lib/sync.mjs";

function suppressConsoleLog(fn) {
  const orig = console.log;
  console.log = () => {};
  try {
    return fn();
  } finally {
    console.log = orig;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

test("runSync fills missing keys from en-US into other locale files", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gopdf-locale-"));
  try {
    writeJson(path.join(dir, "en-US.json"), {
      Metadata: { title: "English", extra: "x" },
      OnlyEn: "hello",
    });
    writeJson(path.join(dir, "de.json"), {
      Metadata: { title: "Deutsch" },
    });

    suppressConsoleLog(() => runSync(dir));

    const de = JSON.parse(fs.readFileSync(path.join(dir, "de.json"), "utf8"));
    assert.equal(de.Metadata.title, "Deutsch");
    assert.equal(de.Metadata.extra, "x");
    assert.equal(de.OnlyEn, "hello");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("runPrune removes keys not present in en-US", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gopdf-locale-"));
  try {
    writeJson(path.join(dir, "en-US.json"), {
      Metadata: { title: "English" },
    });
    writeJson(path.join(dir, "fr.json"), {
      Metadata: { title: "Fr", stale: "remove-me" },
      OrphanSection: { a: 1 },
    });

    suppressConsoleLog(() => runPrune(dir));

    const fr = JSON.parse(fs.readFileSync(path.join(dir, "fr.json"), "utf8"));
    assert.deepEqual(fr, {
      Metadata: { title: "Fr" },
    });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("runSync throws when en-US.json is missing", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gopdf-locale-"));
  try {
    assert.throws(
      () => suppressConsoleLog(() => runSync(dir)),
      /Missing en-US\.json/,
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
