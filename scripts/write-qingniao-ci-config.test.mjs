import assert from "node:assert/strict";
import test from "node:test";

import { AUTH_CHECK, ciQingniaoConfig } from "./write-qingniao-ci-config.mjs";

test("disables the whoami check and keeps the rest of the config", () => {
  const next = ciQingniaoConfig({
    publish: { skipExisting: true },
    checks: { format: true, typecheck: true },
    build: { steps: [{ name: "lint", command: "pnpm lint" }] },
  });

  assert.equal(next.checks[AUTH_CHECK], false);
  assert.equal(next.checks.format, true);
  assert.equal(next.checks.typecheck, true);
  assert.equal(next.publish.skipExisting, true);
  assert.equal(next.build.steps[0].command, "pnpm lint");
});

test("adds a checks object when the source has none", () => {
  const next = ciQingniaoConfig({ publish: { skipExisting: true } });
  assert.equal(next.checks[AUTH_CHECK], false);
  assert.equal(next.publish.skipExisting, true);
});
