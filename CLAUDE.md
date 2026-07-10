@AGENTS.md

## 本仓是什么（OSS）

**发布 `@gopdfjs/*` npm 包（browser + Node）+ standalone `gopdf-cli`（无浏览器）。**

| 交付物 | 路径 | npm 发布 |
|--------|------|----------|
| Rust 算法 | `crates/gopdf-*` | 否 |
| WASM 绑定 | `crates/gopdf-wasm` → `packages/engine/pkg/` | 否 |
| 全部 JS/TS 库 | `packages/*`（`engine`、`struct`、`render`、工具域库…） | 是 |
| Node CLI | **separate `gopdf-cli` repo** — not in this monorepo |

**不在本仓维护（ilovepdf / gopdf.fyi 产品仓）：** React 工具壳、i18n、`use-intl`、L2 `runXxx` 编排。产品 **`pnpm add @gopdfjs/*`** 消费本仓 npm，不复制库代码。

---

## 目录结构（权威）

```
gopdfjs/                          # OSS monorepo
├── crates/                       # Rust；pnpm build:wasm → engine/pkg
├── packages/                     # 全部 @gopdfjs/*（无 pdf-cli）
├── demos/react/                  # 本地浏览器 smoke
│   └── e2e/                      # Playwright（RFC 浏览器验收）
├── site/                         # CLI docs landing（GitHub Pages）；private
├── docs/                         # PUBLISHING.md、persona/
├── .spec/                        # 仅规格：ROADMAP、TASK_TRACKING、rfc/
│   └── rfc/                      # 工具 RFC；umbrella  closed → completed/
└── .cursor/skills/               # agent 工作流（含 gopdf-e2e）
```

| 路径 | 干什么 | 不是什么 |
|------|--------|----------|
| **`crates/`** | PDF 算法 + `gopdf-wasm` | 不是 npm 包 |
| **`packages/`** | 可发布的 `@gopdfjs/*` | 不是产品 UI |
| **`demos/react/`** | 浏览器联调 + **e2e 宿主** | 不是 gopdf.fyi |
| **`site/`** | CLI docs landing（GitHub Pages） | 不是 16 工具产品站 |
| **CLI** | separate **`gopdf-cli`** repo | `gopdf` bin — owns Rust + CLI |
| **`.spec/`** | RFC、路线图、任务 | **没有** e2e 代码、没有 npm 源码 |
| **ilovepdf 仓** | gopdf.fyi UI + 路由 + i18n | 依赖本仓 npm |

---

## 三种消费方式

| 方式 | 入口 | 浏览器 |
|------|------|--------|
| **Browser app** | `import` from `@gopdfjs/engine` 等 | 要 |
| **Node script** | `import` from `@gopdfjs/*` | 不要 |
| **Terminal** | **`gopdf-cli <cmd>`** | 不要 |

每个 **tool RFC** 应对齐：**npm 公开 API** + **`gopdf-cli` 子命令**（实现进度见各 RFC）。详见 **RFC 0058 §2.2**。

---

## RFC 与工作流

| 类型 | 规则 |
|------|------|
| **Tool RFC**（0006+） | 定义 `@gopdfjs/*` 包 + CLI；验收：`cargo test` · 包 Vitest · `demos/react/e2e/tools/<slug>.spec.ts` |
| **Umbrella RFC**（0001–0004） | 只规划；**子 RFC 文件齐了就 close** → `completed/`；**禁止 reopen** |
| **Charter**（0057、0058） | 架构；保持 active |
| **索引** | `.spec/ROADMAP.md` · `.spec/TASK_TRACKING.md` |
| **发布** | `docs/PUBLISHING.md` |

Umbrella 生命周期：`.spec/ROADMAP.md` § **Umbrella RFC lifecycle**。

---

## 测试放在哪

| 层级 | 位置 | 命令 |
|------|------|------|
| Rust | `crates/gopdf-*` | `pnpm test:rust` |
| npm 包 | `packages/*/src` | `pnpm test`（Vitest） |
| 浏览器 e2e | **`demos/react/e2e/tools/`** | `pnpm test:e2e` |
| CLI | `gopdf-cli` repo (standalone) | not here |

浏览器 e2e **不在** `.spec/`。流程见 skill **`gopdf-e2e`**。

---

## Personas & skills（Cursor / Claude Code 共用）

- **具名专家（真人 + 领域专家 + 代理人格）**：`docs/persona/` — **Albert Li** 总责、**Maya Okonkwo** PDF、**Daniel Kowalski** Rust/WASM、**Linus Torvalds** 系统层/合并门槛
- **Claude Code 子代理**：`.claude/agents/`（`gopdf-albert-li`、`gopdf-maya-okonkwo`、`gopdf-daniel-kowalski`、`gopdf-linus-torvalds`）
- **Skills**（`.cursor/skills/`）：
  - **`gopdf-browser-pdf-wasm`** — Rust/WASM/Worker、RFC 0057/0058
  - **`gopdf-e2e`** — Playwright、`demos/react/e2e/`、RFC 浏览器验收
  - **`create-persona`** — 人格文档

---

## 常见误区（别搞错）

- ~~`packages/tools`~~、~~`@gopdfjs/components`~~、~~`@gopdfjs/i18n`~~、~~`locale-cli`~~ → 已移出 OSS
- ~~`.spec/e2e`~~ → 已删；e2e 在 **`demos/react/e2e/`**
- ~~`site/` = 产品工具站~~ → CLI docs landing（GitHub Pages）
- ~~RFC = 做网站~~ → RFC = **npm + CLI**
- ~~L2 编排在本仓~~ → 产品在 **ilovepdf**；本仓只发 **库 + CLI**
