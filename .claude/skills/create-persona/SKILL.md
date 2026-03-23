---
name: create-persona
description: >-
  Creates or updates docs/persona/*.md for one real individual who is a domain expert;
  the page defines duties and a stable expert "voice" (personality) for agents—not
  fiction or generic "the expert". Use for RACI, handoffs, or new persona files.
---

# Create Persona（`docs/persona/*.md`）

通用技能：**在 `docs/persona/` 下新增或改版「具名专家」页**，不限于 GoPDF；本仓库示例见 `albert-li.md`、`maya-okonkwo.md`、`daniel-kowalski.md`、`linus-torvalds.md`。

**核心**：**一人一页 = 一位真人**；在其领域内是 **可信专家**，并为子代理提供 **可辨识的人格**（价值取向、口吻、会先问什么、会坚持什么）——与无姓的「某专家」提示词不同。

## 是什么 / 不是什么

| 是 | 不是 |
|----|------|
| **真实姓名** + **职责** + **与他人的交接** | 「你是某某」的第二人称剧本 |
| **领域专家** + **稳定判断风格（人格）**，便于代理委托时一致 | 虚构角色、或与职责无关的闲聊人设 |
| 长期可审计的 **RACI 式说明** | 无姓名的「某专家」 |

## 路径与命名

1. **目录**：固定为 **`docs/persona/`**（与 Cursor / Claude Code 共用，见根目录 `CLAUDE.md`）。
2. **文件名**：`kebab-case`，建议 **`{given}-{family}-{short-domain}.md`** 或项目约定；与标题中的全名一致。
3. **标题**：`# {Full Name} — {领域}（{项目或 Scope}）`；项目名可选。

## 写作步骤

1. **首段**：第三人称——**谁**（真人）、**负责什么边界**、**向谁交接**（若有）；可一句点出 **专家人格**（例如：偏保守的隐私默认、偏矩阵对齐的 PDF 语义、偏可维护的 WASM 边界）。
2. **## 职责**：列表项可验收（能回答「算不算这个人的事」）。
3. **## 与 {他人} 的协作**（可选）：多负责人时写清交接；单人项目可改为多节职责（见下）。
4. **脚注**（推荐）：`*可将姓名替换为实际成员；职责条目保留。*`

## 清单（发布前）

- [ ] 标题为 **人名** 或团队接受的 **具名角色**，非纯职位缩写。
- [ ] 明确为 **独立真人 + 领域专家**，且能读出 **稳定专家人格**（与职责相关，非虚构闲聊）。
- [ ] 全文 **第三人称**。
- [ ] 更新 **`docs/persona/README.md`** 表格。
- [ ] 若参与 **Claude Code** 委托：对齐 **`.claude/agents/`** 中对应子代理的 `description` 与正文（如适用）；并视需要更新 **`.claude/agents/README.md`** 索引。
- [ ] 若影响领域 Skill：更新 **`.cursor/skills/`** 内对应 `SKILL.md` 的链接。

## 模板：单人、多节（产品总责 + 多领域）

```markdown
# {Full Name} — {Project}

**{Full Name}** 是 **{Project}** 的负责人：{北极星一句}。

## {领域 A}

- …

## {领域 B}

- …
```

## 模板：多人、每人一页

```markdown
# {Full Name} — {Domain}（{Project}）

**{Full Name}** 负责 **{领域}**：{一句}。

## 职责

- …

## 与 {Another Full Name} 的协作

- …
```

## 与 Cursor / Claude Code 的共享

技能文件位于 **`.cursor/skills/`**；根 **`CLAUDE.md`** 声明与本目录一致，便于 **Claude Code** 与 **Cursor** 读同一套说明，无需重复维护多份正文。
