# `@gopdfjs/demo-react`

最小 Vite + React 页面，用来对照测试：

| 路径 | 用途 |
|------|------|
| **pdf.js** | 解析 PDF、读取 `numPages`（与主站 `react-pdf` / `pdfjs-dist` 同源能力） |
| **`@gopdfjs/engine`** | Rust 编译的 WASM：压缩、灰度、线性化（经 Web Worker） |

## 前置：生成 WASM 产物

在仓库根目录执行（需已安装 Rust + `wasm32-unknown-unknown` + `wasm-pack`）：

```bash
pnpm build:wasm
```

未执行时，`pkg/` 不存在，Worker 会报错。

## 启动 demo

```bash
pnpm install
pnpm --filter=@gopdfjs/demo-react dev
```

浏览器打开终端提示的本地 URL，选一个 PDF：先点 **Count pages**（pdf.js），再试 **Compress / Grayscale / Linearize**（wasm），可用 **Download last wasm output** 保存结果。

## 生产站 vs 本 demo

- 正式站点在 **`site/`**，工具页以 pdf.js / pdf-lib 为主，需要 WASM 的能力再接入 `@gopdfjs/engine`。
- **`/tools/compress`**：最小 Compress 页，直调 `@gopdfjs/engine`（需先 `pnpm build:wasm`）。
- 本目录不依赖 `site` 或 ilovepdf 产品包。

## GitHub Pages 部署

`.github/workflows/deploy-site.yml` 在推送到 `main`（`site/**`、`packages/**`、根 lockfile 变更）或手动 **workflow_dispatch** 时构建并发布 `site/dist`。

**仓库设置（一次性）：** Settings → Pages → Build and deployment → Source 选 **GitHub Actions**。

**`VITE_BASE` 示例：**

| 站点类型 | 示例 URL | `VITE_BASE` |
|----------|----------|-------------|
| Project Pages | `https://systembugtj.github.io/gopdfjs/` | `/gopdfjs/` |
| User/org site | `https://systembugtj.github.io/` | `/` |

CI 默认按仓库名自动选择：`*.github.io` 仓库用 `/`，否则 `/<repo-name>/`（如 `/gopdfjs/`）。手动运行 workflow 时可通过 `vite_base` 输入覆盖。

**本地模拟 Project Pages 构建：**

```bash
pnpm build:wasm
VITE_BASE=/gopdfjs/ pnpm --filter=@gopdfjs/demo-react build
pnpm --filter=@gopdfjs/demo-react preview --base /gopdfjs/
```

本地 dev（`pnpm --filter=@gopdfjs/demo-react dev`）仍默认 `VITE_BASE=/`，无需改环境变量。

构建会将 `dist/index.html` 复制为 `dist/404.html`，供 GitHub Pages SPA 深链回退。
