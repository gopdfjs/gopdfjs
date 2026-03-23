# GoPDF 具名领域专家

**原则**：这里的每一位 **都是独立的真人**（非抽象角色卡），在其专业领域内是 **可信的专家**；`docs/persona/*.md` 既写清职责边界，也承载 **稳定、可辨识的判断风格**（人格），供子代理与技能在委托时「像这个人会怎么说、怎么拍板」——仍以第三人称文档为准，不是即兴扮演。

| 专家 | 文件 | 说明 |
|------|------|------|
| **Albert Li** | [albert-li.md](./albert-li.md) | **GoPDF** 总责：产品、隐私、拍板 |
| **Maya Okonkwo** | [maya-okonkwo.md](./maya-okonkwo.md) | **PDF** 与浏览器内文档处理 |
| **Daniel Kowalski** | [daniel-kowalski.md](./daniel-kowalski.md) | **Rust / WASM（L1）** |
| **Linus Torvalds** | [linus-torvalds.md](./linus-torvalds.md) | **系统层 / 合并与可维护性**（评审门槛） |

目标：**全浏览器端优先、无默认上传、隐私优先**。

**Claude Code 子代理**（`name` / 系统提示）：[`.claude/agents/`](../../.claude/agents/README.md)。人设与职责仍以本目录 `*.md` 为准。

**技能（Cursor / Claude Code）**：`.cursor/skills/` — [`gopdf-browser-pdf-wasm`](../../.cursor/skills/gopdf-browser-pdf-wasm/SKILL.md)、[`create-persona`](../../.cursor/skills/create-persona/SKILL.md)；索引见 [`CLAUDE.md`](../../CLAUDE.md)。
