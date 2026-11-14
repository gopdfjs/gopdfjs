# RFC 0062: GitHub Actions CI/CD: feature PRs to develop, weekly promote to main, npm release on main

**Status:** Draft

**Author**: GoPDF maintainers
**Date**: 2026-10-11

## Summary

给本仓加一条 GitHub Actions 发布链：功能分支只通过 PR 进入 `develop`，PR 必须跑过现有测试门；每周一把 `develop` 合进 `main`；`main` 上若有待发布 changeset，再用现有的 `@systembug/qingniao` 把三个公开包发到 npm。`develop` 不发 npm。本 RFC 只定流程，不在获批前改 workflow。

## Problem

今天发布是维护者本机交互完成的，CI 几乎不挡合并。

| 现状 | 证据 |
|------|------|
| 唯一 workflow | `.github/workflows/deploy-site.yml`：`main` 上 `apps/site/**` 变更时部署 GitHub Pages |
| 没有测试 CI | `pnpm validate`、`pnpm test:e2e` 只在本机跑 |
| npm 发布要人盯着 OTP | `docs/PUBLISHING.md`：`pnpm changeset` 之后在终端跑 `pnpm release -y`（即 `qingniao`），NPM 2FA OTP 必须交互输入 |
| 版本基线已经是 `main` | `.changeset/config.json` 的 `baseBranch` 是 `main`；`fixed` 锁步 `@gopdfjs/engine`、`@gopdfjs/adapter-browser`、`@gopdfjs/adapter-node` |
| 工具链版本 | 根 `package.json` 的 `packageManager` 是 `pnpm@10.27.0`；站点 workflow 用 Node 22。仓库没有 `rust-toolchain` 文件 |

因此「功能进 develop、每周进 main、main 发 npm」还没有可执行的定义。直接把本机 `qingniao` 搬进 Actions 会卡在无 TTY 的 OTP 上，并且 `GITHUB_TOKEN` 做出的 push 不会再次触发 workflow，每周合并可能发不出包、也更新不了文档站。

## Goals

- `feature/*` 与 `fix/*` 只通过 PR 进入 `develop`。必过的检查等于本仓已有的测试门，而不是另起一套命令。
- 每周一将 `develop` 领先 `main` 的提交，用 **merge commit** 合入 `main`。没有领先提交时成功空跑。
- 推到 `main` 之后才发 npm。没有待消费的 `.changeset/*.md`（不含 `README.md`）时成功空跑，不升版本、不打 tag。
- 发布仍走 `qingniao` + changesets，三个公开包继续 lockstep。`docs/PUBLISHING.md` 的公开包范围不变。
- 版本提交回到 `develop`，避免下一周 promote 在 `CHANGELOG` / `package.json` 上冲突。
- 认证用 npm trusted publishing（OIDC），不把长期 NPM token 放进仓库。

## Non-goals

- 不发布 `gopdf-cli`，不部署 ilovepdf / gopdf.fyi。
- 不改 changesets 的 `fixed` / `ignore` 名单，不把 `baseBranch` 改成 `develop`。
- 不在本 RFC 获批前新增或修改 `.github/workflows/*`。
- 不把 `pnpm check:vite-sanity` 放进每个功能 PR。它保持 `docs/PUBLISHING.md` 里的发布前检查，只在 `main` 发布 job 里跑。
- 不替换 `deploy-site.yml` 的触发条件；每周合进 `main` 且站点文件有变时，现有 workflow 继续部署 Pages。

## Design

### 分支

| 分支 | 角色 | 谁可以写 |
|------|------|----------|
| `develop` | 集成 | PR。禁止直推 |
| `main` | 发布 | 每周 promote PR，以及 `hotfix/*` → `main` 的紧急 PR。禁止直推 |
| `feature/*`、`fix/*` | 日常 | PR 目标只能是 `develop` |
| `hotfix/*` | 不等每周窗口的修复 | PR 目标是 `main`，同一套 CI。合并后必须把 `main` 回灌 `develop` |

功能 PR 可以 squash。`develop` → `main` 必须是 merge commit，这样 `develop` 的历史还在，回灌不会把每周提交重放成另一份补丁。

### 三个 workflow

保留 `deploy-site.yml`。新增三个文件，职责分开，避免「测试失败也发版」和「发版失败重跑整周合并」。

| 文件 | 触发 | 做什么 |
|------|------|--------|
| `.github/workflows/ci.yml` | `pull_request` 到 `develop` 或 `main`；`workflow_dispatch` | 测试门。分支保护只要求一个 job 名：`verify` |
| `.github/workflows/promote-develop.yml` | `schedule`：`0 15 * * 1`（周一 15:00 UTC）；`workflow_dispatch` | 开或更新 `develop` → `main` 的 PR，检查绿了就 merge |
| `.github/workflows/release.yml` | `push` 到 `main`；`workflow_dispatch`（只允许 dry-run） | changeset 非空时跑发布门 + `qingniao` |

`ci.yml` 并发组按 head ref，`cancel-in-progress: true`。`release.yml` 并发组固定为 `npm-release`，`cancel-in-progress: false`。

### 功能 PR 必须通过的命令

`verify` 依赖两个并行 job，两者都成功才绿。命令用仓库里已有的 script，不新造测试入口。

**`rust-and-js`**（`ubuntu-latest`）：

1. `pnpm/action-setup@v4`，version `10.27.0`；`actions/setup-node@v4`，Node 22，`cache: pnpm`。
2. `dtolnay/rust-toolchain` 安装 stable，target `wasm32-unknown-unknown`；安装 `wasm-pack`。
3. `pnpm install --frozen-lockfile`。
4. `pnpm format:check`（`cargo fmt --all -- --check`）。
5. `pnpm validate`。它已经包含 `pnpm test:rust`、`check:layer-deps`、`check:public-exports`、turbo `test`、`lint`、`build`。不要再单独跑一遍 `pnpm test`。

**`e2e`**：同样的安装步骤，然后 `pnpm exec playwright install --with-deps chromium`，再 `pnpm test:e2e`。`pretest:e2e` 会在 `packages/wasm/pkg/gopdf_wasm_bg.wasm` 缺失时跑 `pnpm build:wasm`。Playwright 配置只用 chromium，webServer 是 demo Vite，端口 `4174`，`CI` 下 `forbidOnly` 且 retries `1`。

**Changeset 门**（挂在 `rust-and-js`，PR 目标是 `develop` 或 `main` 时）：若 diff 碰到 `packages/**` 或 `crates/**`，并且不只有 `apps/site/**`、`apps/demo/**`、`.spec/**`、`docs/**`，则必须带上新的 `.changeset/*.md`。私有包被 changesets `ignore`，但 plugin / crate 的改动会打进三个公开包的 tarball，所以以目录而不是包名作为门。纯文档、纯 demo、纯 spec 不要求 changeset。

### 每周 promote

1. `git fetch`。若 `git rev-list --count origin/main..origin/develop` 为 0，job 成功退出。
2. 用 `gh pr list` 找 open PR：base `main`、head `develop`。没有就 `gh pr create`，标题固定为 `chore: weekly promote develop to main`，body 写明本 PR 只做合并、不发 npm。
3. 等 `ci.yml` 的 `verify` 成功。失败则不合并，PR 留着，并在 job 日志里写失败的 check 名。
4. `gh pr merge <number> --merge`。不要 squash，不要 rebase。

合并用的 token **不能**是默认 `GITHUB_TOKEN`。GitHub 规定 `GITHUB_TOKEN` 产生的 push 不会触发其他 workflow，于是 `release.yml` 和 `deploy-site.yml` 都不会跑。使用 Actions secret `RELEASE_GITHUB_TOKEN`（fine-grained PAT 或 GitHub App installation token）：Contents 读写、Pull requests 读写，并且该身份的 push 能触发 workflow。`GH_TOKEN` 只在 promote job 里设成这个 secret。

### main 上的 npm 发布

`release.yml` 的 `push` 只认 `main`。步骤：

1. checkout，`fetch-depth: 0`，token 用同一个 `RELEASE_GITHUB_TOKEN`，这样版本提交和 tag 推得回去，并且之后的回灌 PR 能打开。
2. 权限只有这三项：`contents: write`，`pull-requests: write`，`id-token: write`。npm 认证走 OIDC，不使用 GitHub Packages。
3. 若 `.changeset/` 下除 `README.md` 和 `config.json` 外没有 `*.md`，成功退出。
4. 安装与 `ci.yml` 相同的 pnpm / Node / Rust / wasm-pack，再跑 `pnpm validate` 与 `pnpm check:vite-sanity`。e2e 已在合入 `main` 的 PR 上跑过，发布 job 不重复跑，避免把发布卡在浏览器下载上。
5. 把 npm CLI 升到 `>=11.5.1`（`npm install -g npm@11`）。Trusted publishing 从该版本起才会自动用 OIDC。Node 22 自带的 npm 不一定满足。
6. `pnpm exec qingniao --json --yes`。没有 `--yes` 时 qingniao 以退出码 3 停住。stdout 是 JSON Lines，人读的诊断在 stderr。`workflow_dispatch` 时改跑 `pnpm exec qingniao --json --yes --dry-run`，不发布。
7. 发布成功后打开或更新 `main` → `develop` 的回灌 PR，标题 `chore: back-merge release commits into develop`。这个 PR 仍走 `ci.yml`。不自动合并，留给人看版本号 diff。

`qingniao` 的 git 分支保持默认 `main`，不要在 `qingniao.config.json` 里改成 `develop`。`.changeset/config.json` 的 `baseBranch` 继续是 `main`：changeset 在功能 PR 里写好，跟着每周合并到达 `main` 后才被 `changeset version` 消费。

`publish.skipExisting: true` 与 `docs/PUBLISHING.md` 里可选的 `qingniao.config.json` 一致。重复跑同一版时跳过已存在的版本，而不是把 job 打红。

### npm 认证

三个公开包各自在 npm 上配置 trusted publisher：

| 字段 | 值 |
|------|-----|
| Organization / user | 仓库所属的 GitHub owner |
| Repository | 本仓库 |
| Workflow filename | `release.yml` |
| 允许的动作 | `npm publish` |

2026-09-03 之后新建的 trusted publisher 默认只允许 `npm stage publish`。配置时必须显式勾上 `npm publish`，否则 CI 里的 `npm publish` 会被拒绝。公开包从公开仓库用 trusted publishing 发布时，provenance 自动附上，不必再加 `--provenance`。

`actions/setup-node` **不要**设 `registry-url`。该选项会写带 token 的 `.npmrc`，盖住 OIDC。

本机 `pnpm release -y` 的交互 OTP 保留给没有 CI 的紧急人工发布，但常规周发布不走这条。获批实现后，`docs/PUBLISHING.md` 的 Release 一节应改成指向本 RFC 的 workflow，并写明人工 OTP 只是逃生通道。

实现时先在 `workflow_dispatch` 上跑 `qingniao doctor --json` 与 `--dry-run`。若 doctor 仍要求 TTY OTP，停在发布步骤，不要改回把 automation token 写进日志。只有 OIDC 被 qingniao 的子进程丢掉时，才允许 secret `NPM_TOKEN`（granular automation token，bypass 2FA）作为备案，并且 RFC 状态要记一笔原因。

### 分支保护（仓库设置，不进 YAML）

| 分支 | 规则 |
|------|------|
| `develop` | 必须 PR；必须通过 `verify`；禁止 force push；管理员也不直推 |
| `main` | 同上。允许的写入来源只有 promote PR、hotfix PR，以及 `release.yml` 用 `RELEASE_GITHUB_TOKEN` 推的版本提交和 tag |

版本提交是 bot 推到 `main` 的，不会再打开 PR。这是 changeset 发布的常规形态。它不包含功能 diff，只含 version、CHANGELOG、删掉已消费的 changeset。

### 方案取舍

每周直接把 `develop` fast-forward 到 `main` 更短，但绕过 `verify`，也和「main 必须 PR」冲突。所以 promote 走 PR + merge commit。

发布若改用 `changesets/action` 在每次 `main` push 上开 Version PR，会和「一周一次、由 qingniao 一次做完 version 与 publish」叠成两套版本机器人。本仓已经把 `pnpm release` 定成 qingniao，CI 调用它，不引入第二套发布 action。

## Acceptance

1. `specify validate` 对本文件通过，ROADMAP 与 TASK_TRACKING 都有 0062。
2. 获批之前，`.github/workflows/` 除既有 `deploy-site.yml` 外没有新文件。
3. 获批实现后：指向 `develop` 的 PR 在 `pnpm validate` 或 `pnpm test:e2e` 失败时不能合并；没有 changeset 的 `packages/` 或 `crates/` 改动不能合并。
4. 周一 schedule 在 `develop` 不领先 `main` 时退出码 0；领先时只产生一个 open 的 promote PR，CI 绿后以 merge commit 进入 `main`。
5. `main` 上没有待发布 changeset 时 `release.yml` 不调用会改 git 的发布；有 changeset 时三个公开包版本 lockstep 上升，npm 上能看到对应版本，并且 provenance 来自 `release.yml`。
6. `develop` 上的 push 或 PR 不会执行 `npm publish`。
7. 发布产生的版本提交有一条回到 `develop` 的 PR。
8. `deploy-site.yml` 的路径过滤和行为保持不变。
