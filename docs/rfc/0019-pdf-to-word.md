# RFC 0019 - PDF to Word

- **Status**: Proposed
- **Author**: Antigravity（修订：GoPDF maintainers）
- **Date**: 2026-03-22

## 1. Objective

将 **常见、以文本层为主的 PDF** 转为可编辑的 **`.docx`**，在浏览器内完成处理（**默认不上传**）。**目标覆盖率约 80%** 的常见用例即可：**不追求**与 PDF 版式像素级一致；以 **可编辑、可保存、主流阅读器可打开** 为准。

## 2. Scope & non-goals

| 范围 | 说明 |
|------|------|
| **覆盖（约 80%）** | 数字 born-digital PDF、单栏/简单多栏、以连续文本为主的文档；接受段落划分、换行与原文 **不完全一致**。 |
| **明确非目标（首版）** | 复杂表格还原、精确页眉页脚、艺术字/纯图 PDF、扫描件（无文字层）——后者可走 **RFC 0020 OCR** 后再导出，或产品内标注「不支持 / 需 OCR」。 |
| **版式** | **不承诺** Word 中与 PDF 视觉一致；产品文案需向用户说明。 |

## 3. Rust / WASM 优先（与 RFC 0057 / 0058 一致）

**默认实现路径**：在 **`packages/pdf-wasm`**（L1）用 **Rust** 完成 **PDF 解析 → 文本抽取 → `.docx` 字节生成**，经 **wasm-bindgen** 导出，由 **Worker** 调用。**不以**「先 Worker 里 pdf.js + npm `docx`」作为主线；那样仅保留为 **极少数兜底**（需经评审并写进变更记录）。

| 层 | 职责 | 实现 |
|----|------|------|
| **L3 应用** | 路由、选文件、下载、进度条、免责声明 | `site/`（Vite + React） |
| **L2 编排** | 单例 Worker、可转移 `ArrayBuffer`、进度、`{ id, op, payload }`（RFC 0057 §5） | `packages/pdf-wasm/worker.ts` 增加 `op: 'pdf_to_docx'`，转调 **L1** |
| **L1 WASM** | **`pdf_to_docx(bytes: &[u8]) -> Vec<u8>`**（或接受进度回调的变体） | `packages/pdf-wasm/src/*.rs` → `wasm-pack` 产物；**新增** `lib.rs` 导出与 **Cargo 依赖**（见 §4） |

**禁止**：在 **主线程** 跑整册转换。长任务仅在 **Worker** 内执行；主线程只做 UI。

### 3.1 Worker 契约（落地以仓库为准）

- **Host → Worker**：`{ id, op: 'pdf_to_docx', payload: { pdf: ArrayBuffer } }`，`pdf` **transfer**。
- **Worker → Host**：
  - 进度：`{ id, ok: true, progress: number }`（0–1）。
  - 完成：`{ id, ok: true, result: Uint8Array }`（`.docx`），`transfer: [result.buffer]`。
  - 失败：`{ id, ok: false, error: string }`。

实现后更新 **RFC 0058** §4 实现表、**0057** §5.2 `op` ↔ Rust 符号表，以及 **`index.ts`** 对外导出（如 `pdfToDocx`）。

## 4. Technical specification（L1 Rust）

- **输入**：PDF 字节（完整文件）。
- **输出**：符合 OOXML 的 **`.docx` ZIP**（`[Content_Types].xml`、`word/document.xml` 等），由 Rust 侧生成；**Deflate/ZIP** 使用 `flate2` / `zip` 等与现有 crate 策略一致的依赖（注意 **WASM 体积**，`opt-level = z` 已启用）。
- **文本抽取**：在 Rust 内解析 PDF 内容流与文字操作符（**候选 crate**：`lopdf` 等；**具体选型在实现 PR 中锁定版本**并评估 **no_std / WASM** 兼容性）。按简单启发式聚合成段落（§2 已限定的 80% 场景）。
- **DOCX 生成**：**候选 crate**：`docx-rs` 等；若需最小依赖，可只生成 **最小合法 docx** 子集（段落 + 纯文本 + 粗斜体若可解析）。
- **JS 兜底**：仅当某类 PDF 在 Rust 路径连续失败且产品接受时，再考虑 **pdf.js** 路径；须在 RFC 或 ADR 中记录，**不作为默认**。

## 5. User experience

- 进度：「解析 PDF…」「生成 Word…」。
- 显著位置：**版式与复杂表格可能丢失**；扫描件需 OCR（**RFC 0020**）。

## 6. Success criteria

- [ ] **L1** `pdf_to_docx` 在 **Worker** 中可调通，主线程无明显长任务。
- [ ] 约 **80%** 自测数字 PDF 样本得到可编辑段落，无崩溃。
- [ ] **RFC 0058** §4 已登记 `pdf_to_docx` / `pdfToDocx`；**0057** 矩阵与本 RFC 一致。
- [ ] 产出 `.docx` 可被 **Microsoft Word / Google Docs** 打开（抽样）。
- [ ] `pdf_wasm_bg.wasm` 体积仍满足 **RFC 0057** gzip 预算（若超标须拆分能力或延迟加载，另文说明）。

## 7. Related RFCs

- **RFC 0057** — Worker 架构与消息协议（**权威**）。
- **RFC 0058** — WASM 库分层与已实现导出表。
- **RFC 0020** — 扫描件 OCR。

---

*修订说明：实现策略已改为 **Rust/WASM（L1）优先**；Worker 内 pdf.js + JS `docx` 非主线。*
