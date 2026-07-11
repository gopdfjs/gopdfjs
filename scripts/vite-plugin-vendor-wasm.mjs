import fs from "node:fs";
import path from "node:path";

/** Copy `gopdf_wasm_bg.wasm` next to adapter `dist/index.js` after Vite build. */
export function vendorWasmPlugin({ wasmPkgDir, outDir }) {
  return {
    name: "gopdf-vendor-wasm",
    closeBundle() {
      const src = path.join(wasmPkgDir, "gopdf_wasm_bg.wasm");
      const dest = path.join(outDir, "gopdf_wasm_bg.wasm");
      if (!fs.existsSync(src)) {
        throw new Error(`Missing WASM artifact: ${src} — run pnpm build:wasm first`);
      }
      fs.copyFileSync(src, dest);
    },
  };
}
