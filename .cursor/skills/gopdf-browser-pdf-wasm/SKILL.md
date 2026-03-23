---
name: gopdf-browser-pdf-wasm
description: >-
  Guides GoPDF browser-native PDF work: Rust/WASM, Web Workers, privacy-first.
  Each persona is a real named expert with domain personality; see docs/persona/*.md
  (incl. Linus Torvalds for merge/systems bar on large WASM/Worker changes).
  Use for PDF tools, wasm-pack, Worker ops, RFC alignment, WASM, pdf-wasm, privacy.
---

# GoPDF：浏览器原生 PDF + Rust WASM（隐私优先）

- **Albert Li** — GoPDF 总责：`docs/persona/albert-li.md`
- **Maya Okonkwo** — PDF / 文档：`docs/persona/maya-okonkwo.md`
- **Daniel Kowalski** — Rust / WASM L1：`docs/persona/daniel-kowalski.md`
- **Linus Torvalds** — 系统层 / 合并与可维护性（大改动评审）：`docs/persona/linus-torvalds.md`

以上 **每人 = 独立真人 + 该领域专家**；persona 文件同时给出 **稳定专家人格**（判断风格），委托子代理时以各页为准。

## 非目标

- 默认不把用户 PDF 当作**必须上传**的后端流程；若需云端，须单独产品/RFC 披露。
- 不把「整站 UI 路由」塞进 Rust；WASM 专注 **L1 算力与字节管道**（RFC 0058）。

## 必读仓库上下文

- **架构**：`docs/rfc/0057-rust-wasm-worker-architecture.md`
- **WASM 边界与已实现 op**：`docs/rfc/0058-wasm-pdf-library-charter.md`
- **具名专家**：`docs/persona/albert-li.md`、`maya-okonkwo.md`、`daniel-kowalski.md`、`linus-torvalds.md`
- **子代理委托**：`.claude/agents/`（与 `docs/persona/*.md` 对应）；索引见 `.claude/agents/README.md`

## 工作方式

1. **主三视角**：Albert（总责/隐私拍板）；Maya（PDF）；Daniel（Rust/WASM）。**大改动/合并前**可拉 **Linus**（系统层与可维护性）。
2. **分层**：渲染/预览优先 pdf.js；轻量结构编辑优先 pdf-lib；重计算走 **Worker + WASM**（0057 矩阵）。
3. **显式委托**：在 Claude Code 中使用 `.claude/agents/` 中的子代理；人设仍以 `docs/persona/` 为准。

## 实现检查（变更前自问）

- 用户文件是否**仅在本地内存/Worker** 中处理？
- 新 `op` 是否已写入 **RFC 0058** 表与 **worker 协议**？
- 是否避免 main 线程同步处理超大 `ArrayBuffer`？

## 输出约定

- 引用 **RFC 编号** 与 **现有导出名**（如 `compress_pdf`），避免虚构 API。
- 隐私相关结论用 **完整句子** 写清数据是否离开浏览器。
