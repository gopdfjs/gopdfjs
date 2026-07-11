# GoPDF.js OSS monorepo

> 完整目录与边界：**`CLAUDE.md`**（本文件为 agent 速查）

## North Star

**Ship `@gopdfjs/*` npm packages** — browser + Node library only.

| 必须 | 说明 |
|------|------|
| 每个 tool RFC → **`@gopdfjs/*` npm** · `engine.*()` on `Gopdf` | `completed/0058-engine-plugin-charter.md` §2.6 |
| 浏览器 | `@gopdfjs/engine` + `@gopdfjs/adapter-browser` |
| Node 库 | `@gopdfjs/engine` + `@gopdfjs/adapter-node` |
| Rust | `crates/` → wasm-pack → adapter `pkg/` |

| **不是本仓** | |
|--------------|--|
| **`gopdf-cli`** · MCP · terminal bin | 独立仓 — **别在本仓加 CLI spec / 实现 / RFC** |
| 产品 UI · i18n | ilovepdf · `apps/demo` smoke only |

架构（closed）：`.spec/rfc/completed/0057-*.md` · `0058-*.md`

**Rust**：`crates/README.md` — `pnpm build:wasm` · `pnpm test:rust`

## 本地开发

| 命令 | 用途 |
|------|------|
| `pnpm dev` / `pnpm dev demo` | Pangu → `apps/demo` |
| `pnpm dev site` | Pangu → `@gopdfjs/site` docs |

## RFC（本仓 = npm only）

- `.spec/ROADMAP.md` · `.spec/TASK_TRACKING.md` · `.spec/rfc/`
- **Done → close → `completed/`** — 无常驻
- **禁止**在本仓写 CLI / MCP RFC 或任务
- 发布：`docs/PUBLISHING.md`
- E2E：`apps/demo/e2e/` · **`gopdf-e2e`**
