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

### 3.1 Framework Selection
We will use `next-intl` due to its first-class support for Next.js 16 App Router features (Server Components, Static Export compatibility).

### 3.2 Routing Strategy
Localized subpaths (e.g., `/en-US/merge`, `/zh-CN/merge`) will be implemented using a root `[locale]` layout segment. 

### 3.3 Translation Management
Translations will be stored in static JSON files located in `@/messages/*.json`. This ensures easy maintenance and efficient loading.

### 3.4 Language Detection
A custom `middleware.ts` will detect the user's preferred language via the `Accept-Language` header and redirect them to the appropriate locale-specific route if no locale is provided in the URL.

## 4. Implementation Roadmap

1. **Setup**: Install `next-intl` and configure middleware/i18n settings.
2. **Restructure**: Move existing routes into the `[locale]` segment.
3. **Drafting Messages**: Create initial JSON files for all 11 locales.
4. **Integration**: Refactor components to pull content from the translation files.
5. **Language Switcher**: Implement a premium UI component for switching languages.
6. **SEO**: Update metadata to include `hreflang` tags for better international indexing.

## 5. Success Criteria

- All static text, tool descriptions, and error messages are translated across 11 locales.
- Switching languages updates the UI immediately and updates the URL correctly.
- SEO tags are correctly generated for each localized page.
