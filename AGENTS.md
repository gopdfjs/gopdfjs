# GoPDF 前端（`site/`）

## 产品目标（North Star）

**纯浏览器 PDF 工具站 — 零服务端应用代码。**

| 必须 | 禁止 |
|------|------|
| 静态 SPA（Vite + React + React Router），可部署到任意静态托管 | 自建后端 API、Serverless 函数、 BFF、上传代理 |
| 所有 PDF 处理在用户设备上完成（主线程 / Web Worker / WASM） | 将用户文件或文档内容发往 GoPDF 自有服务器做转换 |
| 用户文件留在本地；结果通过浏览器下载 | Puppeteer/Playwright 等无头浏览器服务端渲染 |
| 可选：客户端拉取公开资源（受 CORS 限制）、缓存模型权重（IndexedDB） | 云端 LLM / 服务端 TeX（texlive）等需上传文档的远程推理 |

架构分层见 `.spec/rfc/0057-rust-wasm-worker-architecture.md`、`.spec/rfc/0058-wasm-pdf-library-charter.md`。个别 RFC 标注 **browser-only golden rule**；未标注的工具仍须遵守上表。无法实现纯浏览器路径的能力应 **推迟**（见 `.spec/rfc/pending/`）或明确降级，不得引入服务端捷径。

**Rust**：根目录 `Cargo.toml` workspace（`crates/gopdf-*` 算法 + `crates/pdf-wasm` 绑定）；`packages/pdf-wasm` 仅为薄 JS Worker 代理。

**Cargo workspace 约定**（详见 `crates/README.md`）：

- 算法 crate 一律在 `crates/gopdf-*`；禁止在 `packages/pdf-wasm/` 放 `.rs` / `Cargo.toml`
- 构建 WASM：仅在仓库根目录 `pnpm build:wasm`（`wasm-pack` 目标 `crates/pdf-wasm` → `packages/pdf-wasm/pkg/`）
- Rust 单测：仓库根目录 `pnpm test:rust` 或 `cargo test --workspace`
- 共享依赖声明在根 `Cargo.toml` `[workspace.dependencies]`，子 crate 用 `*.workspace = true`

## 技术栈

主应用为 **Vite + React + React Router** 的静态 SPA（`pnpm --filter=@gopdfjs/site dev|build`）。文案与路由共享包为 `@gopdfjs/i18n`（`use-intl` + locale 前缀 + `AppIntlProvider`）。next-intl JSON 在 `site/messages/`；校验用 `pnpm locale:check`（`gopdf-locale check`）。若需查 Next.js 文档，仅在与历史 RFC 对照时参考，默认实现以 Vite 为准。

开发时 `site/vite.config.ts` 中的 `/api/github`、`/api/npm` 仅为 **dev proxy**，不属于产品运行时架构。

## RFC（规范路径）

- **索引与阶段**：`.spec/ROADMAP.md` · **任务**：`.spec/TASK_TRACKING.md`
- **RFC 正文**：`.spec/rfc/NNNN-slug.md`（进行中）；归档 **`completed/`** · **`pending/`** · **`rejected/`**
- **架构必读**：`.spec/rfc/0057-rust-wasm-worker-architecture.md`、`.spec/rfc/0058-wasm-pdf-library-charter.md`
- 旧路径 `docs/rfc/` 已废弃；**禁止**自建 `charter/` `ready/` `implemented/` `proposed/` 等 tier 目录
- 新 RFC / 实现按 **rfc-workflow** 评审后再动代码
