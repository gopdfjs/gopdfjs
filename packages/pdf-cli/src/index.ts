#!/usr/bin/env node

import { runCli } from "./cli.ts";

runCli(process.argv.slice(2))
  .then((code) => process.exit(code))
  .catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[ERROR] ${msg}`);
    process.exit(1);
  });
