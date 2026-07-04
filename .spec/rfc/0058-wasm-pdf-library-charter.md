# RFC 0058 - WASM PDF 库目标与分层（Charter）

- **Status**: Accepted
- **Author**: GoPDF maintainers
- **Date**: 2026-03-22

## 1. Objective

**Every tool RFC exists to specify shippable `@gopdfjs/*` npm packages**. **Prefer exactly one runtime-neutral package** (`Uint8Array` in/out; same import in browser bundlers and Node). **Split into browser + Node packages only when a single package is infeasible** (Worker-only load, DOM/canvas, headless render) — same algorithms, no duplicated logic. Try **conditional exports / subpaths** in one pkg before adding `@gopdfjs/*-node`. **`gopdf-cli`** is a **thin Node wrapper** over whichever npm pkg(s) ship the capability.

本 RFC 与 **RFC 0057** 配套：0057 = WASM Worker 集成；本 RFC = **npm 包边界**、Rust crate 映射、CLI 关系。

**Non-goals for RFCs:** product websites, React shells, i18n, marketing `site/` — those are consumers of npm, not spec targets.

## 2. Library identity

| 项 | 约定 |
|----|------|
| npm scope | **`@gopdfjs/*`** — 全部在 `packages/` |
| **默认** | **单包 isomorphic** — `Uint8Array` in/out；无 DOM / 无 `fs` 进核心 API |
| WASM npm | **`@gopdfjs/engine`** — 目标 **单包**（browser Worker + Node 同 pkg 或 subpath）；仅当无法实现再拆 `-node` |
| 渲染 npm | **`@gopdfjs/render`** — 目标 **单包**；仅 pdf.js/Canvas 无法在 Node 共存时再拆 `-node` |
| Node CLI | **`@gopdfjs/pdf-cli`**（bin **`gopdf-cli`**）— 薄包装 npm；不复制算法 |
| Cargo workspace | 根目录 `Cargo.toml` |
| Rust / WASM algorithm crates | `crates/gopdf-compress`、`crates/gopdf-image`、`crates/gopdf-linearize`、… |
| WASM 绑定 crate | `crates/gopdf-wasm`（`wasm-bindgen`，`cdylib`） |
| JS 宿主 | `packages/engine/`（`index.ts`、`worker.ts`、`workerClient.ts`） |
| 构建产物 | `packages/engine/pkg/`（`wasm-pack build crates/gopdf-wasm`，**gitignore**） |

### 2.1 Monorepo layout

| 路径 | 职责 | npm 发布 |
|------|------|----------|
| **`crates/`** | Rust 算法；浏览器路径经 `gopdf-wasm` → `packages/engine/pkg/` | 否 |
| **`packages/`** | 全部 **`@gopdfjs/*`** 库 + **`pdf-cli`** | 是 |
| **`demos/react/`** | 本地 **浏览器** smoke / Playwright e2e 宿主 | 否 |
| **`site/`** | OSS 文档（WSX）；**不是** RFC 交付物 | 否 |

### 2.2 Delivery model（RFC 必读）

| 消费方式 | 用什么 | 说明 |
|----------|--------|------|
| **Browser app** | **prefer one** `@gopdfjs/*` | 同 import；WASM 走 `@gopdfjs/engine` |
| **Node app / script** | **same pkg** when isomorphic | 读 `Uint8Array` / 路径 |
| **Terminal** | **`gopdf-cli`** | 薄包装上述 npm |
| **Product app** | same npm from registry | ilovepdf / gopdf.fyi — UI only |

每个 numbered tool RFC（0006+）必须声明：**包名（尽量少）**、**是否必须拆分**、**公开 API**、**CLI 子命令**。

维护说明：发布步骤见 [`docs/PUBLISHING.md`](../../docs/PUBLISHING.md)。

### 2.3 Runtime rules（2026-06-28）

**Order of preference:**

1. **One isomorphic npm package** — e.g. `@gopdfjs/runners` (merge, split, …).
2. **One pkg + conditional exports** — e.g. `@gopdfjs/engine` with browser Worker path and Node WASM subpath in **same package**.
3. **Two packages (last resort)** — `@gopdfjs/<name>` (browser) + `@gopdfjs/<name>-node` (Node / CLI) — **only** when (1) or (2) failed; RFC must state **why**.

| 情况 | 包策略 | 示例 |
|------|--------|------|
| pdf-lib / 纯字节 | **单包** | `@gopdfjs/runners` |
| Rust WASM | **单包优先** `@gopdfjs/engine` | `compressPdf()` — Worker in browser; extend Node in same pkg |
| WASM 无法单包 | **才拆** `engine` + `engine-node` | RFC 须写阻塞原因 |
| pdf.js 渲染 | **单包优先** `@gopdfjs/render` | 不行再 `render-node` |
| Hybrid | **最少 pkg 数** | 0017: `runners` + `engine`（各尽量单包） |
| CLI | Node 薄包装 | `gopdf-cli` → 上面的 npm，禁止第二套实现 |

## 3. Package layering（实现分层，非产品层）

| 层 | 职责 | 位置 |
|----|------|------|
| **Rust / WASM** | 大缓冲、Flate、图像、线性化… | `crates/gopdf-*` → `@gopdfjs/engine` |
| **JS / TS 库** | pdf-lib、pdf.js、工具域逻辑 | `packages/runners`, `render`, `shrink`, … |
| **CLI** | 无 UI；Node 读文件、写 stdout/文件 | `packages/pdf-cli` → **`gopdf-cli`** |

**原则**：**能单包就单包**。Rust/WASM → `@gopdfjs/engine`（先扩 Node 进同 pkg）；纯结构 → `@gopdfjs/runners`；渲染 → `@gopdfjs/render`。仅当单 pkg 不可行才 `-node` 拆分。CLI 薄包装。矩阵见 RFC 0057 §6。

## 3.1 `@gopdfjs/engine` 范围（与已规划工具对齐）

GoPDF 定位为 **约 80% 常见场景的 PDF 工具集**，**不是**全功能渲染器或版式编辑器。**`@gopdfjs/engine`** 只承担其中 **大缓冲区 / 高吞吐 / 明确由 RFC 0057 矩阵划入 Rust/WASM** 的部分；其余工具留在 **L3（pdf-lib / pdf.js / 浏览器 API 等）**，或通过 **Hybrid** 只调用本库的 **子步骤**。

### 3.1.1 库内职责（L1 + Worker `op`）

| 类型 | RFC / 工具 | 在 `@gopdfjs/engine` 中的角色 | 状态 |
|------|------------|------------------------|------|
| **流 / 字节热点** | [0008](0008-compress-pdf.md) Compress | `compress_pdf` / `compress` | **Done**（P1 已验收；P2 待 Object Layer） |
| **图像编码** | [0017](completed/0017-jpg-to-pdf.md) JPG→PDF、[0018](completed/0018-pdf-to-jpg.md) PDF→JPG | **仅** `encode_images`（多帧 RGBA→JPEG/PNG）；**组版 / 渲染** 在 L3 | **Done**（编码腿） |
| **整册图像处理** | [0028](0028-grayscale-pdf.md) Grayscale | `grayscale_pdf` / `grayscale` | **Partial**（stub：流内 JPEG/PNG 字节扫描；无 content-stream / 矢量） |
| **线性化** | [0042](0042-web-optimize.md) Web optimize | `linearize_pdf` / `linearize` | **Partial**（stub：注入 `Linearized` 字典；无对象重排 / hint stream） |
| **PDF→Word（窄域）** | [0019](0019-pdf-to-word.md) | `pdf_to_docx` / `pdfToDocx`（Rust 优先）；见 RFC 0019 非目标 | **Not started** |

### 3.1.2 Hybrid（本库仅为一条腿）

| RFC / 工具 | `@gopdfjs/engine` 负责 | 不在本库负责 |
|------------|-----------------|--------------|
| [0017](completed/0017-jpg-to-pdf.md) | 批量 **重编码**（`encode_images`） | 用 pdf-lib 等 **拼成 PDF** |
| [0018](completed/0018-pdf-to-jpg.md) | 出图后的 **JPEG/PNG 编码**（`encode_images`） | **渲染** 页面为位图（pdf.js / Canvas，L3） |

### 3.1.3 明确不在 `@gopdfjs/engine`（按当前 RFC 0057 矩阵）

以下已规划工具 **默认** 由 **L3 JS** 或其它运行时完成；**不得**在未改 RFC 0057 §6 与本文的前提下，把实现硬塞进 `@gopdfjs/engine`：

- **结构级**：Merge [0006](completed/0006-merge-pdf.md)、Split [0007](completed/0007-split-pdf.md)、Organize [0010](completed/0010-organize-pdf.md)、Rotate [0009](completed/0009-rotate-pdf.md)、Crop [0011](completed/0011-crop-pdf.md) 等（pdf-lib 类）。
- **渲染**：PDF→JPG 的页面**渲染**（pdf.js / Canvas，L3）。
- **OCR**：[0020](completed/0020-ocr-pdf.md)（tesseract.js 等）。
- **密码 / 加密策略**：[0021](completed/0021-protect-pdf.md)、[0022](completed/0022-unlock-pdf.md)（以各 RFC 为准；**非**本 crate 默认职责）。
- **其余** `.spec/rfc/` 中工具：凡 **RFC 0057 §6** 记为 **JS** 或未升级为 **Rust/WASM / Hybrid** 的，均 **不在** `@gopdfjs/engine` 范围内，直至矩阵修订。

> **注**：[0061](0061-understand-pdf.md) Understand PDF 已升级为 WASM 候选（见 §3.2.3）；上方列表已将其移除。

## 3.2 PDF Object Layer（自建，非 lopdf）

### 3.2.1 决策：自建，不依赖 lopdf

经分析 lopdf 0.33 源码，放弃作为依赖引入，原因：

| 问题 | lopdf 现状 | 对 WASM 的影响 |
|------|-----------|---------------|
| 强制全文档加载 | `BTreeMap<ObjectId, Object>` 一次性 parse 全部 object | 100 MB PDF = 100 MB+ 堆，WASM linear memory 压力极大 |
| `ttf-parser` 非可选 | `Cargo.toml` 无 `optional = true` | 无法 feature-gate；+400 KB gzip，直接超 RFC 0057 §9 的 1 MB 预算 |
| `rayon` 默认开启 | `rayon` 是 default feature | `wasm32-unknown-unknown` 无线程；需手动 `--no-default-features`，且文档无保证 |
| xref 作为加载列表 | `Document::load_from` 解析 xref 后立即 parse 所有对象 | 无法实现按需（lazy）访问 |
| 无惰性引用 | `Object::Reference(ObjectId)` 是裸整数对，无 lazy proxy | 工具每次需自行追踪引用链 |

**结论**：lopdf 架构设计目标是服务器端全文档编辑，而非浏览器内逐步处理。GoPDF 需要一个从设计上就是 lazy、WASM-first 的对象层。

### 3.2.2 架构：xref-as-index + 惰性对象

**核心数据结构**

```rust
// xref 仅存字节偏移，不存解析后的对象
type XrefTable = HashMap<ObjectId, XrefEntry>;

enum XrefEntry {
    Free,
    InUse { offset: u32, gen: u16 },
    Compressed { container_id: u32, index: u16 },  // PDF 1.5+ ObjStm
}

// 对象句柄：已缓存 or 待按需解析
enum ObjectSlot {
    Parsed(Object),                    // 已解析，缓存在 HashMap
    Pending(u32, u16),                 // (offset, gen)，尚未解析
}
```

**惰性访问模式**

```rust
impl Document {
    /// 只读取并缓存请求的对象，不 parse 全文档
    pub fn get_object(&mut self, id: ObjectId) -> Result<&Object, PdfError> {
        if !self.cache.contains_key(&id) {
            let entry = self.xref.get(&id)?;
            let obj = self.parse_object_at(entry)?;
            self.cache.insert(id, obj);
        }
        Ok(&self.cache[&id])
    }
}
```

**增量写回（不全文重写）**

Phase 2 压缩、灰度等操作仅修改部分 stream bytes，采用 PDF 增量更新（incremental update）追加到文件末尾：

```
[原始 PDF bytes]
[修改后的 object bytes — 追加]
[新 xref table / xref stream]
[新 trailer，指向新 xref]
%%EOF
```

这避免了重写整个 PDF，也避免了需要在内存中持有完整文档的可变副本。

### 3.2.3 文件结构

```
crates/
  gopdf-compress/src/lib.rs   # Phase 1 流压缩（已落地）
  gopdf-image/src/lib.rs      # 图像编码 / 灰度（已落地）
  gopdf-linearize/src/lib.rs  # 线性化（已落地）
  gopdf-wasm/src/
    lib.rs                    # wasm-bindgen 导出（薄层）
    pdf/                      # 规划：Object Layer（§3.2，未落地）
      mod.rs
      xref.rs
      parser.rs
      writer.rs
      types.rs
  # 未来 Phase 2 / RFC 0061 等可增 gopdf-analyze、扩展 gopdf-compress
```

### 3.2.4 对象层与工具的关系

| 工具 / RFC | 依赖 pdf/ 层的哪个能力 |
|-----------|----------------------|
| RFC 0008 Phase 2 — 压缩（图像重编码） | `xref.rs` 定位 Image XObject；`writer.rs` 增量写回 `/Length` |
| RFC 0061 — Understand PDF | `parser.rs` 解析 metadata dict、page tree、image XObject 统计 |
| RFC 0019 — PDF→DOCX | `parser.rs` + `xref.rs` 遍历文本流、font dict |

**RFC 0061 升级**：Understand PDF 从「L3 / pdfjs-dist + pdf-lib」升级为 **L1 WASM**（`analyze_pdf` op）。数据不离开浏览器；解析在 Worker 中完成，主线程零阻塞。具体 Worker op 定义须在 RFC 0057 §5.2 补充后方可实现。

### 3.2.5 包体积估算

| 组件 | 估算 gzip 增量 |
|------|--------------|
| `pdf/` object layer（纯 Rust，无外部大依赖） | +40–80 KB |
| lopdf（对照，含 ttf-parser） | +400–600 KB |
| 当前 `@gopdfjs/engine`（基准） | ~280 KB |
| 加入 pdf/ 层后预估 | ~320–360 KB（仍在 1 MB 预算内） |

ttf-parser 依赖不引入；字体数据在 RFC 0019 阶段单独评估。

### 3.2.6 约束与非目标（对象层层面）

- **不做**全规格 PDF parser（不支持全加密变体、XFA 表单、印刷级色彩管理）。
- **不引入** rayon 或任何 `std::thread`——`wasm32-unknown-unknown` 无线程支持。
- **不承诺**对所有畸形 xref（交叉引用表损坏）的修复；检测并返回错误。
- **加密支持**特性门控（`#[cfg(feature = "encrypt")]`），默认不编译；RFC 0021/0022 落地前不开启。
- **字体解析**特性门控（`#[cfg(feature = "font")]`），默认不编译；RFC 0019 落地前不开启。

## 3.3 非目标（库层面）

- **不做**全规格 PDF 阅读器、**不做**像素级 WYSIWYG 编辑内核。
- **不承诺**对所有畸形 PDF、全加密变体、印刷级色彩管理的兼容；以 **各工具 RFC** 与 **80% 常见文件** 为验收口径。
- **不**为每个工具单独复制一套 Worker；**统一** `packages/engine/worker.ts` 协议（RFC 0057 §5）。

## 3.4 未来进入 `@gopdfjs/engine` 的程序

若某工具需迁入 L1：**先** 在 **RFC 0057 §6** 改 **Decision** 与理由，**再** 更新本文 §4 / §6.1，**再** 实现 `lib.rs` / `worker.ts` / `index.ts`。

## 4. Implemented WASM surface（与代码一致）

以下导出在 `crates/gopdf-wasm/src/lib.rs` 与 `packages/engine/worker.ts` 中已实现，主机侧见 `packages/engine/index.ts`：

| Rust / Worker `op` | TS 导出 | 说明 |
|--------------------|---------|------|
| `compress_pdf` | `compressPdf` | RFC 0008 P1 **Done**（流级 Flate）；P2 画质/降采样待 Object Layer |
| `encode_images` | `encodeImages` + `splitEncodedImages` | RFC 0017 / 0018 编码腿 **Done** |
| `grayscale_pdf` | `grayscalePdf` | RFC 0028 **Partial stub** — `image_ops::grayscale_pdf`（非 RFC 完整验收） |
| `linearize_pdf` | `linearizePdf` | RFC 0042 **Partial stub** — `linearize::inject_linearized_dict`（非 spec 线性化） |

**未实现**（旧 RFC 草案中的名称，不得再写进集成示例）：`imagesToPdf`、`pdfToImages` 作为单一 Worker 操作。若未来增加，须先改 `lib.rs` / `worker.ts` / `index.ts`，再更新 RFC 0057 矩阵与本表。

## 5. Consumer map

| 消费者 | 用途 |
|--------|------|
| **npm（单包优先）** | `@gopdfjs/runners`, `@gopdfjs/engine`, … — browser + Node 同一 pkg 为目标 |
| **npm（拆分，例外）** | `@gopdfjs/*-node` — 仅当 RFC 记录单 pkg 不可行 |
| **`gopdf-cli`** | Node 薄包装上述 npm |
| **`demos/react/`** | 浏览器 smoke + e2e |
| **`site/`** | 文档与 Quick Start |

## 6. Related RFCs

- **RFC 0057** — Worker 架构、构建、Vite 集成、工具决策矩阵（**权威**）。
- **RFC 0008** — P1 WASM 导出已验收；**0028 / 0042** — Worker 导出存在但为 **stub**（见 §3.1.1、§4）。
- **RFC 0017 / 0018** — 产品路径可仍以 pdf-lib / pdfjs 为主；**编码热点**应对齐 `encodeImages`（见各 RFC §5 修订版）。
- **RFC 0019** — PDF to Word：**L1 Rust/WASM 优先**（`pdf_to_docx`）；同一 Worker 协议；见该 RFC §3。
- **RFC 0061** — Understand PDF：已从「L3/pdfjs-dist」升级为 **L1 WASM**（`analyze_pdf` op，依赖 §3.2 Object Layer）；须先更新 RFC 0057 §5.2 和 RFC 0061，再实现 `ops/analyze.rs`。

### 6.1 Planned Worker `op`（以代码落地为准）

| Worker `op` | RFC | 说明 |
|---------------|-----|------|
| `pdf_to_docx` | [0019](0019-pdf-to-word.md) | Proposed；**L1 Rust/WASM 优先**；依赖 §3.2 Object Layer（font feature-gate）；落地后须更新 §4 与 **0057** §5.2。 |
| `analyze_pdf` | [0061](0061-understand-pdf.md) | Proposed；**L1 WASM**（metadata、页数、图像 XObject 统计）；依赖 §3.2 Object Layer；落地后须更新 §4 与 **0057** §5.2，并更新 RFC 0061。 |

## 7. Success criteria（库层面）

- [x] 根目录 `pnpm build:wasm`（`wasm-pack build crates/gopdf-wasm`）可生成 `packages/engine/pkg/`
- [x] Worker 协议支持进度与最终 `Uint8Array` 可转移回主线程
- [ ] 各工具 RFC 对应的 **npm API + CLI 子命令** 均已实现并测试

### 7.1 PDF Object Layer（§3.2）里程碑

- [ ] `pdf/xref.rs`：解析 traditional xref table + PDF 1.5 xref stream + ObjStm 索引；10 个参考 PDF 测试通过
- [ ] `pdf/parser.rs`：惰性对象 get（`Document::get_object`）；parse dict / stream / array / name / string；引用链解析
- [ ] `pdf/writer.rs`：增量更新写回；写出的文件可被 Adobe Reader、Chrome、pdf.js 打开
- [ ] `wasm-pack` 加入 pdf/ 层后 gzip 体积 ≤ 400 KB（≤ RFC 0057 §9 预算 1 MB）
- [ ] RFC 0008 Phase 2：`ops/compress.rs` 使用 pdf/ 层完成图像重编码 + `/Length` rewrite
- [ ] RFC 0061：`ops/analyze.rs` 实现 `analyze_pdf` op，返回 metadata + 页数 + 图像 XObject 数量
