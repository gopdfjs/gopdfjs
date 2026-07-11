# RFC 0057 - Rust/WASM Engine Architecture & `GopdfEngine`

- **Status**: Accepted (revised 2026-07-11 — WASM build per adapter; engine exports `.` only)
- **Author**: Antigravity (revised for `@gopdfjs` engine + adapter model)
- **Date**: 2026-03-21

## 1. Objective

定义 GoPDF 中 **Rust → WebAssembly → `GopdfEngine` port** 的构建、加载与 adapter 集成。

这里的 WASM 不是 consumer-facing API，也不是顶层产品边界；它只是 **engine plugins 可选使用的 acceleration backend**。

**库边界与消费方式**见 **RFC 0058**（engine + adapter charter）。

**核心变更（2026-07-11）：**

- **`@gopdfjs/wasm`** npm 包：`packages/wasm/rust/` bindgen → workspace `crates/gopdf-*`；`pnpm build:wasm` → **单个** `pkg/`（wasm-pack `--target web`）
- **一份共享 `.wasm` + 一份 glue**；adapter 自行 init：browser `init()` fetch 同目录 `.wasm`，node 把 `.wasm` bytes 喂给同一个 `init()`。**无** per-host JS 重复
- adapter **import** `@gopdfjs/wasm`（node 再 `require.resolve("@gopdfjs/wasm/gopdf_wasm_bg.wasm")` 读字节）；engine **不** import wasm
- `@gopdfjs/engine` **`exports` 仅 `"."`** — 无 `./pkg/*` · `./compare` · `./render` 子路径
- WASM 由 adapter 实现 `GopdfEngine`；engine **`createGopdfRuntime(adapter)`** 建 runtime，不加载 pkg

**核心变更（2026-07-08）：**

- WASM **不再**作为 `@gopdfjs/engine` 顶层导出给消费者
- 消费者 **只** 调用 `createEngine(adapter)` → feature APIs；不接触 WASM primitives

## 2. Why Rust/WASM (and When Not To)

### When WASM wins

大字节缓冲的 Flate 重压缩、批量图像编码、流级变换 — Rust 在线性内存上更可预测。

### When to stay with JavaScript

I/O、交互、pdf-lib 结构编辑、SubtleCrypto 加密 — 保留 JS（见 §6 矩阵）。

### SubtleCrypto exception

`protectPdf` / `unlockPdf` 用 **SubtleCrypto**（硬件加速），不用 WASM 重造 AES。

## 3. Package structure（engine + adapter）

| 组件 | 路径 | 发布 |
|------|------|------|
| Rust 算法 | `crates/gopdf-compress`, `gopdf-image`, `gopdf-linearize`, … | 否 |
| WASM | `@gopdfjs/wasm` | `rust/` + 单个 `pkg/`（web target，共享 `.wasm`） | 是（adapter-only import） |
| 契约 | `packages/adapter` — `GopdfEngine`, `GopdfAdapter`, … | 是 |
| 共享 model | `packages/model` — `PdfDocument`, `CanvasSurface`, … | 是 |
| 门面 | `packages/engine` — `createEngine` only | 是 |
| Browser adapter | `packages/adapter-browser` — browser env work only: `GopdfEngine` + `PdfJsRuntime` + canvas | 是 |
| Node adapter | `packages/adapter-node` — Node env work only: `GopdfEngine` + `PdfJsRuntime` + canvas + OCR | 是 |
| 插件域 | `packages/plugin-struct`, `plugin-shrink`, `plugin-grayscale`, … | 是（engine 内部 wire；**非 consumer facade**） |
| CLI | **separate `gopdf-cli` repo** | 独立发布 |

```mermaid
flowchart LR
    Crates["crates/gopdf-*"] --> Wasm["packages/wasm/rust (bindgen)"]
    Wasm --> Pkg["@gopdfjs/wasm pkg/ (single web build)"]
    Pkg --> BrowserAdapter["createBrowserEngine() — init() fetch"]
    Pkg --> NodeAdapter["createNodeEngine() — init(bytes)"]
    BrowserAdapter --> AdapterBundle["GopdfAdapter.engine"]
    NodeAdapter --> AdapterBundle
    AdapterBundle --> Engine["@gopdfjs/engine<br/>createEngine(adapter) -> Gopdf"]
```

**禁止：** 宿主 / 产品 / plugin / **engine** 直接加载 WASM 符号。只有 **adapter** import 共享 `@gopdfjs/wasm` 并自行 init；feature 经 `GopdfEngine` port → `createEngine(adapter)` → `engine.*()`。

### 3.1 How WASM works（端到端）

| 步 | 谁 | 干什么 |
|----|-----|--------|
| 1 | `crates/gopdf-*` | Rust 算法 |
| 2 | `packages/wasm/rust` | wasm-bindgen 导出 `compress_pdf` 等符号 |
| 3 | `pnpm build:wasm` | wasm-pack `--target web` → **单个** `packages/wasm/pkg/`（gitignore） |
| 4 | `adapter-browser` / `adapter-node` | import 共享 `@gopdfjs/wasm`；browser `init()` fetch，node `init(bytes)` → `GopdfEngine` |
| 5 | `createEngine(adapter)` | adapter 包装为 `GopdfRuntime`（RFC 0058 §2.3.3）；`ownPdfBytes` 后调 port |
| 6 | plugin（如 `@gopdfjs/plugin-shrink`） | 收 domain args + **`GopdfRuntime`**（`loadDocument` / `getPdfOps` / `createCanvas`）；**不接触 adapter** |
| 7 | consumer | **只** `engine.compressPdf(bytes, level)` — 不碰 `@gopdfjs/wasm`、不碰 `compress_pdf` |

```mermaid
flowchart TD
    Rust["crates/gopdf-compress, gopdf-image, …"] --> Bind["packages/wasm/rust (bindgen)"]
    Bind --> Pkg["@gopdfjs/wasm pkg/ (single web build)"]
    Pkg --> AdB["createBrowserEngine() — init() fetch"]
    Pkg --> AdN["createNodeEngine() — init(bytes)"]
    AdB --> Port["GopdfAdapter.engine : GopdfEngine"]
    AdN --> Port
    Port --> Facade["createEngine(adapter) -> Gopdf<br/>engine builds GopdfRuntime from adapter"]
    Facade --> RT["GopdfRuntime<br/>loadDocument · getPdfOps · createCanvas<br/>NO wasm ops exposed"]
    RT --> Plugin["@gopdfjs/plugin-shrink 等 plugin"]
    Facade --> App["consumer: engine.compressPdf()"]
```

### 3.2 Repository roles

| 路径 | 用途 |
|------|------|
| `crates/` | Rust 算法；WASM bindgen 在 `packages/wasm/rust/`；`cargo test --workspace` |
| `packages/wasm/pkg/` | wasm-pack 产物（gitignore）；**单个 web build，adapter 共享** |
| `packages/adapter` | 零 env 契约（`GopdfAdapter` · `GopdfEngine` · bytes） |
| `packages/runtime` | `GopdfRuntime` 契约（plugins only） |
| `packages/model` | 共享 document/canvas 类型 |
| `packages/engine` | `createEngine` 门面 + runtime wiring；**无** wasm-pack 输出 |
| `packages/adapter-*` | 唯一 WASM/pdf.js/canvas/OCR 加载点 |
| `apps/demo/` | 浏览器 acceptance + Playwright |
| `apps/site/` | 文档 |

## 4. Build pipeline

### 4.1 Prerequisites

```bash
rustup target add wasm32-unknown-unknown
# wasm-pack: https://rustwasm.github.io/wasm-pack/installer/
```

### 4.2 Build（根目录 orchestrates；单个产物在 `@gopdfjs/wasm`）

```bash
pnpm build:wasm
# → pnpm --filter=@gopdfjs/wasm build:wasm
```

单个 web-target build（`packages/wasm/package.json`，`--out-dir` 相对 `rust/` crate 根）：

```bash
wasm-pack build rust --target web --out-dir ../pkg --release
```

一份 `.wasm` + 一份 glue 服务两端。adapter 决定 init：

| Host | Adapter | Init |
|------|---------|------|
| browser | `adapter-browser` | `await init()` — fetch 同目录 `gopdf_wasm_bg.wasm` |
| node | `adapter-node` | `await init({ module_or_path: readFileSync(resolve(".wasm")) })` |

### 4.3 Vite 宿主（`apps/demo/`）

- `vite-plugin-wasm` + `vite-plugin-top-level-await`
- `optimizeDeps.exclude: ["@gopdfjs/engine"]`
- `server.fs.allow` 含 monorepo 根（Vite 解析 `@gopdfjs/wasm/pkg/*.wasm`）
- 见 `apps/demo/vite.config.ts`

**外部消费者同样适用：** bundle `@gopdfjs/adapter-browser` 的宿主（Vite/webpack）需等效配置（wasm asset 处理 + top-level await）；发布前须在 README / PUBLISHING.md 提供该指引。

### 4.4 `@gopdfjs/engine` exports（consumer only）

```json
{
  "name": "@gopdfjs/engine",
  "exports": {
    ".": "./src/index.ts"
  }
}
```

| 子路径 | 谁可用 | 说明 |
|--------|--------|------|
| `.` | consumer | `createEngine`、类型 re-export；**无** WASM · adapter · plugin 泄漏 |

WASM 不在 engine 包 export。Compare / render / `splitEncodedImages` 亦 **无** engine 子路径 — compare 经 `engine.comparePdfText()` / `createCompareSession()`（`@gopdfjs/plugin-compare` 仅 engine 内部 wire）；render 与 blob 拆分 → engine 内部模块（不 export）。

共享 WASM 产物随 **`@gopdfjs/wasm`** 发布（单个 `pkg/`，`exports` 为 `.` + `./gopdf_wasm_bg.wasm`）；adapter 依赖它并自行 init。

## 5. WASM integration（adapter 加载）

### 5.1 `GopdfEngine` port（RFC 0058 §2.3.3）

契约：`packages/adapter/src/engine.ts`（`GopdfEngine` port）

```ts
interface GopdfEngine {
  compressPdf(bytes, level, onProgress?): Promise<Uint8Array>;
  encodeImages(pixelsFlat, widths, heights, format, quality?): Promise<Uint8Array>;
  grayscalePdf(bytes): Promise<Uint8Array>;
  linearizePdf(bytes): Promise<Uint8Array>;
}
```

`GopdfEngine` 是 **engine-internal acceleration contract**。它服务 plugin orchestration，不是默认 consumer API。

### 5.2 Adapter 实现

同一 `@gopdfjs/wasm` glue，两端只有 init 入参不同（`adapter-*/src/loadWasm.ts`）：

**Browser** — 空参 `init()` 让 glue fetch 同目录 `.wasm`：

```ts
import init, { compress_pdf, … } from "@gopdfjs/wasm";
await init();
```

**Node** — 无 fetch，`require.resolve` 拿 `.wasm` 路径读字节喂给同一个 `init()`：

```ts
import init, { compress_pdf, … } from "@gopdfjs/wasm";
const require = createRequire(import.meta.url);
const wasmPath = require.resolve("@gopdfjs/wasm/gopdf_wasm_bg.wasm");
await init({ module_or_path: fs.readFileSync(wasmPath) });
```

### 5.3 Rust / WASM 符号表

| WASM export | `GopdfEngine` | RFC | 状态 |
|-------------|---------------|-----|------|
| `compress_pdf` | plugin `compressPdf` path | 0008 | **Done** P1 |
| `encode_images` | image/pdf render plugins | 0017/0018 | **Done** |
| `grayscale_pdf` | plugin `grayscalePdf` path | 0028 | **Partial** stub |
| `linearize_pdf` | plugin `linearizePdf` path | 0042 | **Partial** stub |

源码：`packages/wasm/rust/src/lib.rs` + 各 `crates/gopdf-*/src/lib.rs`。

### 5.4 Worker（历史 / 可选）

早期设计用 dedicated `worker.ts` + `postMessage` 协议。当前 adapter **主线程/Node 直接** wasm-bindgen。

若未来为浏览器主线程隔离 reintroduce Worker：

- Worker 仅实现 `GopdfEngine` 四方法
- 协议：`{ id, op, payload }` + `transfer`（见旧 §5.1 草案）
- **对外 API 不变** — 仍经 `createEngine(adapter)`

### 5.5 消费者示例（唯一正确路径）

```ts
import { createBrowserGopdf } from "@gopdfjs/adapter-browser";

const engine = await createBrowserGopdf();
const bytes = new Uint8Array(await file.arrayBuffer());

const out = await engine.compressPdf(bytes, "recommended", (f) => {
  console.log(Math.round(f * 100), "%");
});

// `encodeImages` stays below the consumer feature layer.
```

```ts
import { createNodeGopdf } from "@gopdfjs/adapter-node";

const engine = await createNodeGopdf();
const out = await engine.linearizePdf(bytes);
```

## 6. Tool decision matrix

| RFC | Tool | WASM / JS | consumer-facing API | internal accelerator |
|-----|------|-----------|---------------------|----------------------|
| 0008 | Compress | **WASM** | `compressPdf` | `compressPdf` |
| 0017 | JPG→PDF | **Hybrid** | `jpgToPdf` | `encodeImages` |
| 0018 | PDF→JPG | **Hybrid** | `pdfToJpeg` | `encodeImages` |
| 0028 | Grayscale | **WASM** stub | `grayscalePdf` | `grayscalePdf` |
| 0042 | Linearize | **WASM** stub | `linearizePdf` | `linearizePdf` |
| 0006–0016 | Struct edits | **JS** pdf-lib | `mergePdfs`, `splitPdf`, … | — |
| 0019 | PDF→Word | **JS** (+ future WASM) | `pdfToWord` | optional future backend |
| 0020 | OCR | **JS** tesseract | `ocr` (Node) | — |
| 0021/0022 | Protect/Unlock | **JS** crypto | `protectPdf` / `unlockPdf` | — |
| 0026 | Redact | **JS** + raster | `redactPdf` | — |
| 0027 | Repair | **JS** | `repairPdf` | — |
| 0061 | Analyze | **JS** (+ future WASM) | `analyzePdf` | optional future backend |

矩阵修订须同步 RFC 0058 §2.6 与 `createEngine.ts`。

## 7. Progress reporting

`compressPdf` / 长任务：`GopdfEngine.compressPdf` 的 `onProgress(fraction)`；门面透传 `engine.compressPdf(bytes, level, onProgress)`。

## 8. Testing strategy

### 8.1 Rust

```bash
pnpm test:rust   # cargo test --workspace
```

### 8.2 Unit — adapters + engine + contracts

| 包 | 必测项 |
|----|--------|
| `@gopdfjs/adapter` | `assertPdfBytesReadable` · async contract |
| `@gopdfjs/engine` | `createEngine` routing · **facade bytes pressure（全部方法；ownership 主责）** · integration chain |
| `@gopdfjs/adapter-node` | env-port 单测：pdfjs · canvas · OCR · WASM 四 op（full coverage 未完成） |
| `@gopdfjs/adapter-browser` | env-port 单测：pdfjs · canvas · WASM init（发布仍看真实浏览器 e2e） |
| `@gopdfjs/plugin-shrink` | compress ownership（双 loadDocument） |
| 工具域 | 各 `plugin-*` 现有 Vitest |

### 8.3 Browser e2e（真实 Chromium）

```bash
pnpm test:e2e
```

| 文件 | 覆盖 |
|------|------|
| `apps/demo/e2e/tools/all-tools.spec.ts` | 33 generic `Gopdf` 路由（`toolIds.ts` 实际计数；随工具增长） |
| `compress.spec.ts` | RFC 0008 |
| `engine-smoke.spec.ts` | bytes 链式压力 |

**规则：** 新 `Gopdf` 方法 → `apps/demo` 路由 + `toolIds.ts` + e2e 矩阵行。

### 8.4 Node integration（发布前 P0）

`packages/engine/src/__tests__/integrationBytesChain.test.ts` 模式扩展到 **每个** `Gopdf` 方法（`createNodeGopdf` + fixture）。

## 9. Success criteria

- [x] `pnpm build:wasm` → **单个** `@gopdfjs/wasm/pkg/`（web target，共享 `.wasm`）
- [x] `@gopdfjs/engine` exports **only** `"."`
- [x] `GopdfEngine` 由 browser + node adapter 实现（共享 `@gopdfjs/wasm`，各自 init）
- [x] `createEngine` 为唯一 WASM 工具消费路径（engine 建 runtime，不 load pkg）
- [x] Facade byte ownership 测试
- [ ] Node adapter full port 单测
- [ ] Browser e2e 全工具全绿
- [ ] 10 MB 级 PDF 稳定（按工具抽测）
- [ ] `gopdf_wasm_bg.wasm` gzip < 1 MB
- [ ] PDF Object Layer → 解锁 0008 P2 / 真实 0028·0042

## 10. Related

- **RFC 0058** — engine + adapter charter、§2.6 方法表、发布门禁
- **RFC 0008** — compress P1
- Skill **`gopdf-e2e`** · **`gopdf-browser-pdf-wasm`**
