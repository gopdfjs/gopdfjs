import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { GOPDF_PORTS } from "../ports";

/** Static docs/marketing site — no WASM or browser PDF processing. */
export default defineConfig({
  base: process.env.VITE_BASE ?? "/",
  plugins: [react()],
  server: {
    port: GOPDF_PORTS.siteDev,
    strictPort: true,
  },
  preview: {
    port: GOPDF_PORTS.siteDev,
    strictPort: true,
  },
});
