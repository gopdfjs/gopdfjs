---
rfc: "0005"
tier: charter
verified: false
browser_only: true
tests:
  unit: none
  e2e_playwright: none
---

# RFC 0005: Multi-Language Support (i18n)

**Status:** Proposed
**Author:** Antigravity AI
**Date:** 2026-03-21

## 1. Objective

Enable global reach for GoPDF (gopdf.fyi) by supporting 11 major locales. This will allow users to interact with the platform in their native language, significantly improving accessibility and UX.

## 2. Proposed Locales

The following 11 locales will be supported:

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

## 3. Technical Architecture

> **Stack note**: GoPDF is a **Vite + React + React Router** static SPA (see AGENTS.md / RFC 0057). There are no Next.js Server Components or `middleware.ts`. The shared text/routing package is **`@gopdfjs/i18n`** (`use-intl` + locale prefix).

### 3.1 Framework Selection
We use **`use-intl`** (via the shared **`@gopdfjs/i18n`** package). It is framework-agnostic and works in a Vite SPA with static export; no server runtime required.

### 3.2 Routing Strategy
Localized path prefixes (e.g., `/en-US/merge`, `/zh-CN/merge`) via a **React Router** locale segment. The active locale is read from the URL and provided through the `use-intl` provider.

### 3.3 Translation Management
Translations are stored as static JSON message files, loaded by `@gopdfjs/i18n`. Per-locale chunks can be lazy-loaded so only the active locale ships to the client.

### 3.4 Language Detection
Detection runs **client-side** (no server middleware): on first load read `navigator.languages`, pick the best match, and redirect to the locale-prefixed route. Choice persisted in `localStorage`.

## 4. Implementation Roadmap

1. **Setup**: Wire `@gopdfjs/i18n` (`use-intl`) into the Vite app provider.
2. **Restructure**: Add a locale-prefix segment to the React Router config.
3. **Drafting Messages**: Create initial JSON files for all 11 locales.
4. **Integration**: Refactor components to pull content from `@gopdfjs/i18n`.
5. **Language Switcher**: Implement a premium UI component for switching languages.
6. **SEO**: Emit `hreflang` tags per localized route (static-export friendly).

## 5. Success Criteria

- All static text, tool descriptions, and error messages are translated across 11 locales.
- Switching languages updates the UI immediately and updates the URL correctly.
- SEO tags are correctly generated for each localized page.
