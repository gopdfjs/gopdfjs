import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { resolveGopdfCommand } from "../resolveGopdfCommand";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })),
  );
});

async function makeTempDir(prefix: string): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

describe("resolveGopdfCommand", () => {
  it("maps src/index.ts to dist/index.mjs when dist exists", async () => {
    const root = await makeTempDir("gopdf-resolve-");
    const srcEntry = path.join(root, "src", "index.ts");
    const distEntry = path.join(root, "dist", "index.mjs");

    await fs.mkdir(path.dirname(srcEntry), { recursive: true });
    await fs.mkdir(path.dirname(distEntry), { recursive: true });
    await fs.writeFile(srcEntry, "export {};\n", "utf8");
    await fs.writeFile(distEntry, "#!/usr/bin/env node\n", "utf8");

    const resolved = resolveGopdfCommand(srcEntry);
    expect(resolved.endsWith(".ts")).toBe(false);
    expect(resolved.endsWith("dist/index.mjs")).toBe(true);
  });

  it("never returns a .ts path from an explicit commandPath", async () => {
    const root = await makeTempDir("gopdf-resolve-ts-");
    const srcEntry = path.join(root, "src", "index.ts");
    await fs.mkdir(path.dirname(srcEntry), { recursive: true });
    await fs.writeFile(srcEntry, "export {};\n", "utf8");

    expect(() => resolveGopdfCommand(srcEntry)).toThrow(/TypeScript CLI entry/);
  });

  it("returns the resolved dist path for dist/index.mjs", async () => {
    const root = await makeTempDir("gopdf-resolve-dist-");
    const distEntry = path.join(root, "dist", "index.mjs");
    await fs.mkdir(path.dirname(distEntry), { recursive: true });
    await fs.writeFile(distEntry, "#!/usr/bin/env node\n", "utf8");

    const resolved = resolveGopdfCommand(distEntry);
    expect(resolved.endsWith(".ts")).toBe(false);
    expect(resolved.endsWith("dist/index.mjs")).toBe(true);
  });
});
