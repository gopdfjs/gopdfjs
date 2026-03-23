@AGENTS.md

## Personas & skills（Cursor / Claude Code 共用）

- **具名专家（真人 + 领域专家 + 代理人格）**：`docs/persona/` — 每人 **独立真人**、**专业权威**；叙事给子代理 **稳定人格与判断风格**（**Albert Li** 总责、**Maya Okonkwo** PDF、**Daniel Kowalski** Rust/WASM、**Linus Torvalds** 系统层/合并门槛）
- **Claude Code 子代理（与 persona 对应）**：`.claude/agents/`（`gopdf-albert-li`、`gopdf-maya-okonkwo`、`gopdf-daniel-kowalski`、`gopdf-linus-torvalds`）
- **Cursor / 共享 skills**：`.cursor/skills/`（`create-persona`、`gopdf-browser-pdf-wasm`）
