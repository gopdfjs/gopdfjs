import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { resolveMessagesDir } from "../lib/resolve-messages-dir.mjs";

test("MESSAGES_DIR wins over argv flag", () => {
  const dir = resolveMessagesDir(
    ["node", "gopdf-locale", "sync", "--messages-dir=/from-arg"],
    { MESSAGES_DIR: "/from-env" },
  );
  assert.equal(dir, path.resolve("/from-env"));
});

test("--messages-dir=PATH is used when env unset", () => {
  const dir = resolveMessagesDir(
    ["node", "gopdf-locale", "prune", "--messages-dir=/custom"],
    {},
  );
  assert.equal(dir, path.resolve("/custom"));
});

test("defaults to cwd/messages", () => {
  const dir = resolveMessagesDir(["node", "gopdf-locale", "sync"], {});
  assert.equal(dir, path.resolve(process.cwd(), "messages"));
});
