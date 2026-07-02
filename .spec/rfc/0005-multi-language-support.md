# RFC 0005: Multi-Language Support (i18n)

- **Status**: Completed (monorepo — next-intl JSON + `use-intl` runtime; product `hreflang` is deployment follow-up)
- **Author**: Antigravity AI
- **Date**: 2026-03-21

## 1. Objective

Enable global reach for GoPDF (gopdf.fyi) by supporting 11 major locales. Users interact in their native language; URLs use locale prefixes (e.g. `/en-US/tools/merge`).

## 2. Locales (source of truth)

Defined in `packages/i18n/src/locales.ts` (`@gopdfjs/i18n`):

| Locale | Language | Region/Dialect |
|--------|----------|----------------|
| `zh-CN` | Chinese | Simplified |
| `zh-TW` | Chinese | Traditional |
| `ja` | Japanese | Japan |
| `ko` | Korean | South Korea |
| `en-US` | English | United States |
| `en-GB` | English | United Kingdom |
| `en-CA` | English | Canada |
| `fr` | French | France |
| `es` | Spanish | Spain |
| `de` | German | Germany |
| `ru` | Russian | Russia |

## 3. Technical architecture (monorepo — actual)

| Concern | Choice | Location |
|---------|--------|----------|
| **Runtime i18n** | [`use-intl`](https://next-intl.dev/docs/environments/core-library) (next-intl core for Vite/React SPA) | `@gopdfjs/ui`, product app |
| **Routing / Link** | `@gopdfjs/i18n` | `packages/i18n/src/routing.tsx` |
| **Locale list** | `locales` const | `packages/i18n/src/locales.ts` |
| **Message JSON** | next-intl–compatible nested JSON | `site/messages/<locale>.json` |
| **Message helpers** | `MESSAGES_DIR`, `messagesFileName` | `packages/i18n/src/messages.ts` |
| **Locale CLI** | `@gopdfjs/locale-cli` (`gopdf-locale`) | `sync` / `prune` / `check` on next-intl JSON |
| **Intl provider** | `AppIntlProvider` (`use-intl`) | `packages/i18n/src/intl-provider.tsx` |
| **Language switcher** | `LanguagePicker` | `packages/ui/src/LanguagePicker.tsx` |

### 3.1 Product vs monorepo

- **gopdf.fyi** may use **Next.js** + `next-intl` middleware in deployment; this monorepo **`site/`** is **Vite + React Router** (`AGENTS.md`) and uses **`use-intl`** (same message format and ICU placeholders).
- Shared contract: **11 locales**, **JSON message files**, **locale-prefixed paths**.

### 3.2 Message file layout

```
site/messages/
  en-US.json    ← canonical key set
  zh-CN.json
  … (one file per locale in locales.ts)
```

`gopdf-locale check` (and `pnpm locale:check` at repo root) enforces parity across all locale files vs `en-US.json`, ICU placeholders, and `@gopdfjs/ui` translation keys.

## 4. Success criteria

- [x] `site/messages/*.json` exists for every locale in `locales.ts`
- [x] Parity + UI key gate: `pnpm locale:check` / `pnpm --filter=@gopdfjs/i18n test`
- [ ] Language switcher updates URL + UI on product (gopdf.fyi deployment)
- [ ] `hreflang` / per-locale SEO metadata on tool pages (product deployment)

## 5. Out of scope (this RFC)

- Machine translation pipeline
- RTL locales

## 6. Implementation status (2026-06-28)

| Item | State | Notes |
|------|-------|-------|
| `locales.ts` (11 locales) | **Done** | Matches §2 table |
| `@gopdfjs/i18n` routing | **Done** | `routing.tsx`, tests |
| `LanguagePicker` UI | **Done** | `@gopdfjs/ui` |
| `site/messages/` JSON | **Done** | `en-US.json` canonical + 10 locale files; ICU tokens on header/footer keys |
| `locale-cli` | **Done** | `gopdf-locale sync|prune|check` (next-intl JSON) |
| `AppIntlProvider` | **Done** | `use-intl` wrapper for Vite apps |
| Parity / UI gate | **Done** | `gopdf-locale check` + i18n test delegates to CLI |
| Product i18n / SEO | **Follow-up** | `hreflang` + live switcher on gopdf.fyi |

**Verdict**: **COMPLETED** for monorepo next-intl stack (`use-intl` + JSON corpus + CLI). Human translation pass and product SEO are optional follow-ups.
