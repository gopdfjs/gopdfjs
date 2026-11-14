import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateChangesetGate,
} from "./require-changeset.mjs";

test("docs, demo, and spec diffs do not need a changeset", () => {
  const result = evaluateChangesetGate([
    "docs/PUBLISHING.md",
    "apps/demo/src/main.tsx",
    "apps/site/index.html",
    ".spec/rfc/0062-github-actions-release-pipeline.md",
  ]);
  assert.equal(result.ok, true);
  assert.equal(result.reason, "no-package-or-crate-diff");
});

test("a package diff without a changeset fails", () => {
  const result = evaluateChangesetGate(["packages/engine/src/index.ts"]);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "missing-changeset");
});

test("a crate diff without a changeset fails", () => {
  const result = evaluateChangesetGate(["crates/gopdf-compress/src/lib.rs"]);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "missing-changeset");
});

test("README and config.json do not satisfy the gate", () => {
  const result = evaluateChangesetGate([
    "packages/engine/package.json",
    ".changeset/README.md",
    ".changeset/config.json",
  ]);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "missing-changeset");
});

test("a new changeset markdown file passes", () => {
  const result = evaluateChangesetGate([
    "crates/gopdf-wasm/src/lib.rs",
    "docs/PUBLISHING.md",
    ".changeset/weekly-bump.md",
  ]);
  assert.equal(result.ok, true);
  assert.equal(result.reason, "changeset-present");
});
