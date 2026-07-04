# GoPDF.js OSS monorepo

> 完整目录与边界：**`CLAUDE.md`**（本文件为 agent 速查）

## North Star

**Ship `@gopdfjs/*` npm packages for browser and Node. Ship `gopdf-cli` for the same tools without a browser.**

| 必须 | 说明 |
|------|------|
| 每个 tool RFC → **npm 包**（公开 API）+ **CLI 子命令**（Node，无 UI） | 见 RFC 0058 §2.2 |
| 浏览器路径 | `@gopdfjs/engine` Worker + JS 库；文件不离开本机 |
| Node 路径 | `import` 库和/或 **`gopdf-cli`** |
| Rust 在 `crates/` | `pnpm build:wasm` → `packages/engine/pkg/` |

| 非本仓 RFC 目标 | |
|----------------|--|
| 产品网站 UI、i18n、营销页 | `site/` CLI docs landing（GitHub Pages）；`demos/react/` 本地浏览器测试 |

架构：**RFC 0057**（WASM Worker）· **RFC 0058 §2.2**（npm + CLI 交付）

**Rust 约定**（`crates/README.md`）：

- 算法只在 `crates/gopdf-*`；禁止在 `packages/engine/` 放 `.rs`
- `pnpm build:wasm` · `pnpm test:rust` / `cargo test --workspace`

## 本地开发

| 命令 | 用途 |
|------|------|
| `pnpm build:cli` · `gopdf-cli ./file.pdf` | Node CLI（无浏览器） |
| `pnpm --filter=@gopdfjs/site dev` | CLI docs landing（GitHub Pages，无 WASM） |

## RFC

- `.spec/ROADMAP.md` · `.spec/TASK_TRACKING.md`
- `.spec/rfc/NNNN-*.md`；归档 `completed/` · `pending/` · `rejected/`
- **Umbrella RFC**：子 RFC 全部生成后 **close** → 移入 `completed/`（见 ROADMAP § Umbrella RFC lifecycle）
- 发布：`docs/PUBLISHING.md`
- E2E：`demos/react/e2e/` · skill **`gopdf-e2e`** · `pnpm test:e2e`
