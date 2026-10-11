# GoPDF.js OSS monorepo

> 完整目录与边界：**`CLAUDE.md`**（本文件为 agent 速查）

## North Star

**Ship `@gopdfjs/*` npm packages** — browser + Node library only.

| 必须 | 说明 |
|------|------|
| 每个 tool RFC → **`@gopdfjs/*` npm** · `engine.*()` on `Gopdf` | `completed/0058-engine-plugin-charter.md` §2.6 |
| 浏览器 | `@gopdfjs/adapter-browser` → `createEngine(adapter)` → `engine.*()` |
| Node 库 | `@gopdfjs/adapter-node` → `createEngine(adapter)` → `engine.*()` |
| Rust | `crates/` → wasm-pack → adapter `pkg/` |

## Consumer API（app / LLM 必读）

**唯一对外入口** = `createEngine(adapter)` → `Gopdf` → `engine.*()`。详见 `apps/site/public/docs/guide/ai-help.md`。

| 环境 | adapter | 典型宿主 |
|------|---------|----------|
| **Browser** | `createBrowserAdapter()` from `@gopdfjs/adapter-browser` | React · Vite · **Next.js client** (`"use client"`) |
| **Node** | `createNodeAdapter()` from `@gopdfjs/adapter-node` | scripts · `gopdf-cli` · server-only jobs |

```ts
// Browser / Next.js client — always this pattern
import { createEngine } from "@gopdfjs/engine";
import { createBrowserAdapter } from "@gopdfjs/adapter-browser";

const engine = createEngine(await createBrowserAdapter());
const out = await engine.compressPdf(bytes, "recommended");
const text = await engine.ocr(bytes, "eng");
```

**禁止（产品 / demo / 任何 app 代码）：**

| ❌ 错误 | ✅ 正确 |
|---------|---------|
| `import … from "@gopdfjs/plugin-*"` | `engine.mergePdfs()` 等 `engine.*()` |
| `import … from "@gopdfjs/plugin-extract/ocr"`（路径不存在） | `engine.ocr(bytes, lang)` |
| `export * from "@gopdfjs/plugin-struct"` 薄 re-export | 直接调 `engine.*()`；勿绕门面 |
| Next.js **client** 用 `createNodeAdapter()` | client → `createBrowserAdapter()` only |
| 直接 import `@gopdfjs/wasm` / `@gopdfjs/runtime` | 经 adapter + engine |

`@gopdfjs/plugin-*` 是 **engine 内部接线**，`private` 或未发布子路径；RFC 旧稿里 `apps/web/lib/tools/*.ts` re-export plugin 的写法 **已废弃**（见 RFC 0058）。

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
