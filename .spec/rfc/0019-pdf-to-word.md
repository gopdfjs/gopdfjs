---
rfc: "0019"
tier: proposed
verified: false
browser_only: false
tests:
  unit: none
  e2e_playwright: none
---


# RFC 0019 - PDF to Word

- **Status**: Proposed (L1 WASM) — **Not started** in monorepo
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

## 3. Delivery (RFC 0058 §2.2 / §2.3)

| Surface | Package | Runtime | Notes |
|---------|---------|---------|-------|
| **npm** | `@gopdfjs/engine` | isomorphic (target) | `pdfToDocx()` — one pkg; browser Worker + Node WASM; split `-node` only if blocked |
| **CLI** | `gopdf-cli pdf-to-word` | node | thin wrapper over `@gopdfjs/engine` |
| **ilovepdf** | consumes npm | — | UI out of repo |



## 4. Rust / WASM implementation

**Default path**: Rust L1 `pdf_to_docx` in `crates/gopdf-*` → `@gopdfjs/engine` Worker. **Not** `site/` product UI.

## 5. Technical specification（L1 Rust）

- **输入**：PDF 字节（完整文件）。
- **输出**：符合 OOXML 的 **`.docx` ZIP**（`[Content_Types].xml`、`word/document.xml` 等），由 Rust 侧生成；**Deflate/ZIP** 使用 `flate2` / `zip` 等与现有 crate 策略一致的依赖（注意 **WASM 体积**，`opt-level = z` 已启用）。
- **文本抽取**：在 Rust 内解析 PDF 内容流与文字操作符（**候选 crate**：`lopdf` 等；**具体选型在实现 PR 中锁定版本**并评估 **no_std / WASM** 兼容性）。按简单启发式聚合成段落（§2 已限定的 80% 场景）。
- **DOCX 生成**：**候选 crate**：`docx-rs` 等；若需最小依赖，可只生成 **最小合法 docx** 子集（段落 + 纯文本 + 粗斜体若可解析）。
- **JS 兜底**：仅当某类 PDF 在 Rust 路径连续失败且产品接受时，再考虑 **pdf.js** 路径；须在 RFC 或 ADR 中记录，**不作为默认**。

## 6. User experience

- 进度：「解析 PDF…」「生成 Word…」。
- 显著位置：**版式与复杂表格可能丢失**；扫描件需 OCR（**RFC 0020**）。

## 7. Success criteria

- [ ] **L1** `pdf_to_docx` 在 **Worker** 中可调通，主线程无明显长任务。
- [ ] 约 **80%** 自测数字 PDF 样本得到可编辑段落，无崩溃。
- [ ] **RFC 0058** §4 已登记 `pdf_to_docx` / `pdfToDocx`；**0057** 矩阵与本 RFC 一致。
- [ ] 产出 `.docx` 可被 **Microsoft Word / Google Docs** 打开（抽样）。
- [ ] `gopdf_wasm_bg.wasm` 体积仍满足 **RFC 0057** gzip 预算（若超标须拆分能力或延迟加载，另文说明）。

## 8. Related RFCs

- **RFC 0057** — Worker 架构与消息协议（**权威**）。
- **RFC 0058** — WASM 库分层与已实现导出表。
- **RFC 0020** — 扫描件 OCR。

---

*修订说明：实现策略已改为 **Rust/WASM（L1）优先**；Worker 内 pdf.js + JS `docx` 非主线。*

## 9. Implementation status (2026-06-28)

| Surface | Package | Runtime | State | Notes |
|---------|---------|---------|-------|-------|
| **npm** | `@gopdfjs/engine` | isomorphic (target) | **Not started** | `pdfToDocx()` (planned) — browser Worker today; Node in same pkg; split `-node` only if blocked |
| **CLI** | `gopdf-cli pdf-to-word` | node | **Planned** | thin wrapper over npm above |
| **Rust / WASM** | — | — | Not started | per RFC + [0057](../0057-rust-wasm-engine-architecture.md) |
| **Vitest** | — | — | **Partial** | `packages/engine (planned)` |
| **Browser e2e** | — | browser | **Not done** | `demos/react/e2e/tools/pdf-to-word.spec.ts` |
| **ilovepdf** | — | — | out of repo | consumes npm; not OSS gate |

**Verdict**: **NOT STARTED** (L1) — **one npm pkg by default**; split browser + `-node` **only if** single pkg infeasible ([0058 §2.3](../0058-engine-plugin-charter.md)). CLI wraps npm; no forked logic.
