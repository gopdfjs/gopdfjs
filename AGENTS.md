# GoPDF.js OSS monorepo

> 完整目录与边界：**`CLAUDE.md`**（本文件为 agent 速查）

## North Star

**Ship `@gopdfjs/*` npm packages for browser and Node. Ship `gopdf-cli` for the same tools without a browser.**

| 必须 | 说明 |
|------|------|
| 每个 tool RFC → **npm 包**（公开 API）+ **CLI 子命令**（Node，无 UI） | 见 RFC 0058 §2.2 |
| 浏览器路径 | `@gopdfjs/engine` Worker + JS 库；文件不离开本机 |
| Node 路径 | `import` 库和/或 **`gopdf-cli`** |
| Rust 在 `crates/` | each adapter `pnpm build:wasm` → own `pkg/` |

| 非本仓 RFC 目标 | |
|----------------|--|
| 产品网站 UI、i18n、营销页 | `apps/site/` CLI docs landing（GitHub Pages）；`apps/demo/` 本地浏览器测试 |

架构：**RFC 0057**（WASM Worker）· **RFC 0058 §2.2**（npm + CLI 交付）

**Rust 约定**（`crates/README.md`）：

- 算法只在 `crates/gopdf-*`；禁止在 `packages/engine/` 放 `.rs`
- `pnpm build:wasm` · `pnpm test:rust` / `cargo test --workspace`

## 本地开发

| 命令 | 用途 |
|------|------|
| CLI | **separate repo** [`gopdf-cli`](https://github.com/gopdfjs/gopdf-cli) — zero coupling |
| `pnpm dev` / `pnpm dev demo` | **Pangu** — `pangu.config.json` → workspace demo（`apps/demo`） |
| `pnpm dev site` | Pangu → `@gopdfjs/site` docs landing |

## RFC

- `.spec/ROADMAP.md` · `.spec/TASK_TRACKING.md`
- `.spec/rfc/NNNN-*.md`；归档 `completed/` · `pending/` · `rejected/`
- **Umbrella RFC**：子 RFC 全部生成后 **close** → `completed/`（见 ROADMAP § Umbrella RFC lifecycle）
- **架构 RFC**（0057、0058）= **普通 RFC**；架构落地后 **close** → `completed/`。关不掉 = mono RFC → 拆子 RFC / TASK_TRACKING（见 ROADMAP § RFC lifecycle）
- 发布：`docs/PUBLISHING.md`
- E2E：`apps/demo/e2e/` · skill **`gopdf-e2e`** · `pnpm test:e2e`
