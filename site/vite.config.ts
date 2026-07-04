import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** Static docs/marketing site — no WASM or browser PDF processing. */
export default defineConfig({
  base: process.env.VITE_BASE ?? "/",
  plugins: [react()],
});
