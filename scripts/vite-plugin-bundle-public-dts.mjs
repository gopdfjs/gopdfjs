import { readFileSync } from "node:fs";
import path from "node:path";
import { rollup } from "rollup";
import dts from "rollup-plugin-dts";

/**
 * After Vite JS build, emit a single `dist/index.d.ts` (inlines internal @gopdfjs/*).
 * @param {{ pkgDir?: string; keepEngineExternal?: boolean }} options
 */
export function bundlePublicTypesPlugin(options = {}) {
  const pkgDir = options.pkgDir ?? process.cwd();
  const keepEngineExternal = options.keepEngineExternal ?? false;

  return {
    name: "bundle-public-types",
    async closeBundle() {
      const entry = path.join(pkgDir, "src/index.ts");
      const outFile = path.join(pkgDir, "dist/index.d.ts");
      const pkg = JSON.parse(readFileSync(path.join(pkgDir, "package.json"), "utf8"));
      const npmExternal = new Set(Object.keys(pkg.dependencies ?? {}));

      /** Inline monorepo @gopdfjs/* except published `@gopdfjs/engine` on adapters. */
      function external(id) {
        if (
          keepEngineExternal &&
          (id === "@gopdfjs/engine" || id.startsWith("@gopdfjs/engine/"))
        ) {
          return true;
        }
        if (id.startsWith("@gopdfjs/")) return false;
        return [...npmExternal].some((name) => id === name || id.startsWith(`${name}/`));
      }

      const bundle = await rollup({
        input: entry,
        external,
        plugins: [dts({ tsconfig: path.join(pkgDir, "tsconfig.json") })],
      });
      await bundle.write({ file: outFile, format: "es" });
    },
  };
}
