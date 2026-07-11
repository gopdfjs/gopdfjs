# `@gopdfjs/site`

CLI docs landing page for GoPDF.js (GitHub Pages): token calculator, install cards, MCP setup, and CLI vs traditional PDF workflow comparison. **No WASM or browser PDF processing** — PDF work runs via `gopdf-cli` on the host.

## Local dev

```bash
pnpm install
pnpm --filter=@gopdfjs/site dev   # http://127.0.0.1:5175
```

Ports: `apps/ports.ts` · registry `../../port.md` (ws/prj).

## How to publish site to GitHub Pages

1. **One-time setup:** GitHub repo → **Settings** → **Pages** → Source = **GitHub Actions**.
2. **Automatic deploy:** Push changes under `apps/site/` to `main` → workflow runs → site live at `https://<user>.github.io/gopdfjs/`.
3. **Manual redeploy:** **Actions** tab → **Deploy site to GitHub Pages** → **Run workflow**.
4. **Local preview before push:**

   ```bash
   pnpm --filter=@gopdfjs/site build
   ```

5. **Different repo path?** Edit `VITE_BASE` in `.github/workflows/deploy-site.yml` (one line at the top).

Workflow only triggers on `apps/site/**` changes (plus the workflow file itself). No Rust or WASM build step.
