# `@gopdfjs/demo-react`

最小 Vite + React 页面，用来对照测试：

| 路径 | 用途 |
|------|------|
| **pdf.js** | 解析 PDF、读取 `numPages`（与主站 `react-pdf` / `pdfjs-dist` 同源能力） |
| **`@gopdfjs/pdf-wasm`** | Rust 编译的 WASM：压缩、灰度、线性化（经 Web Worker） |

## 前置：生成 WASM 产物

在仓库根目录执行（需已安装 Rust + `wasm32-unknown-unknown` + `wasm-pack`）：

```bash
pnpm --filter=@gopdfjs/pdf-wasm build:wasm
```

未执行时，`pkg/` 不存在，Worker 会报错。

## 启动 demo

```bash
pnpm install
pnpm --filter=@gopdfjs/demo-react dev
```

浏览器打开终端提示的本地 URL，选一个 PDF：先点 **Count pages**（pdf.js），再试 **Compress / Grayscale / Linearize**（wasm），可用 **Download last wasm output** 保存结果。

## 生产站 vs 本 demo

- 正式站点在 **`site/`**，工具页以 pdf.js / pdf-lib 为主，需要 WASM 的能力再接入 `@gopdfjs/pdf-wasm`。
- 本目录刻意不依赖 `site`、`@gopdfjs/ui`、i18n，仅保留与 WASM 联调相关的依赖。
