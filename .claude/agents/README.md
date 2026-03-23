# GoPDF — Claude Code 子代理（`.claude/agents/`）

本目录为 **Claude Code** 项目级子代理定义（Markdown + YAML frontmatter），与 **`docs/persona/*.md` 一一对应：每位 persona 是独立真人、领域专家**；persona 页写清职责，并体现其 **专家人格**（稳定口吻与价值取向）。**子代理的系统提示以 persona 为准**，此处补充 `description` 与委托触发语。

| 子代理 `name` | Persona |
|----------------|---------|
| `gopdf-albert-li` | [albert-li.md](../../docs/persona/albert-li.md) |
| `gopdf-maya-okonkwo` | [maya-okonkwo.md](../../docs/persona/maya-okonkwo.md) |
| `gopdf-daniel-kowalski` | [daniel-kowalski.md](../../docs/persona/daniel-kowalski.md) |
| `gopdf-linus-torvalds` | [linus-torvalds.md](../../docs/persona/linus-torvalds.md) |

**合并顺序**：新工具 — Albert（总责）→ Maya（PDF）→ Daniel（Rust/WASM）。性能争议 — Daniel 主导，Maya 确认有损与提示，Albert 产品拍板。隐私争议 — Albert + 产品。**大规模或破坏性 L1/Worker 改动** — 可委托 **Linus**（系统层与合并门槛评审）。

官方说明：[Create custom subagents](https://docs.anthropic.com/en/docs/claude-code/subagents)（`.claude/agents/` 为项目级作用域）。
