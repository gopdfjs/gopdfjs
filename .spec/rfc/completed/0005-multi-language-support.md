# RFC 0005: Multi-Language Support (i18n)

- **Status**: Closed — moved out of OSS monorepo (2026-06-28)
- **Author**: Antigravity AI
- **Date**: 2026-03-21

## 1. Objective (historical)

Product i18n for gopdf.fyi (11 locales, locale-prefixed URLs). **Not** an OSS `@gopdfjs/*` deliverable.

## 2. OSS monorepo today

| Item | Location |
|------|----------|
| Docs i18n | `apps/site/public/locales/` (i18next) |
| Product i18n | **ilovepdf** — `use-intl` / next-intl JSON / UI |

Removed from gopdfjs: `@gopdfjs/i18n`, `@gopdfjs/locale-cli`, `@gopdfjs/components`, `apps/site/messages/`.

## 3. Closure

Umbrella scope **moved out**. Do not reopen. Product work → ilovepdf repo.

## 4. Implementation status (2026-06-28)

| Surface | State | Notes |
|---------|-------|-------|
| **npm** | **N/A** | i18n not published from gopdfjs |
| **CLI** | **N/A** | — |
| **OSS site** | **Done** | i18next docs only |

**Verdict**: **MOVED OUT** — not tracked in OSS RFC gate.
