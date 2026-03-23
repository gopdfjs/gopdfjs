# GoPDF.fyi - Free & Private Online PDF Tools

**GoPDF.fyi** is a professional-grade, browser-native PDF processing platform built for convenience and perfected for privacy. Every tool runs 100% locally in your browser — your documents never touch a server.

![GoPDF Logo](file:///Users/albert.li/.gemini/antigravity/brain/13c1fe1b-40e1-439d-9e1b-8bf6fcb2657b/gopdf_logo_minimalist_v2_1774151049261.png)

## 🚀 Key Features
- **100% Native**: Powered by `pdf-lib` and `pdfjs-dist` for client-side processing.
- **Privacy First**: No file uploads. No server-side storage. Purely local data handling.
- **Massive Inventory**: 17 existing tools and 34+ proposed advanced tools.
- **Global Support**: Fully internationalized (i18n) with 11 supported locales.
- **Technical Rigor**: 56 standardized RFCs documenting every planned and implemented function.

## 🏗️ Architecture (Monorepo)
The project is structured as a Turborepo-managed monorepo for maximum scalability and code reuse:
- **`site`**: **@gopdfjs** 官网（与 [wsxjs/site](https://github.com/wsxjs/wsxjs/tree/main/site) **同功能全集**：UnoCSS、wsx-press 文档、Router、EditorJS/Marked/SlideJS/CalendarJS 示例、多语言）；品牌与仓库指向 GoPDF，`gopdf-app` 根元素，Pages 默认 `base`=`/gopdf/`。
- **`demos/react`**: 最小对照页，本地验证 **pdf.js** 与 **`@gopdfjs/pdf-wasm`**（见该目录 `README.md`）。
- **`packages/ui`**: Shared React components and design system (Tailwind).
- **`packages/i18n`**: Shared routing and locale management.

## 🛠️ Technical Stack
- **Framework**: [Vite](https://vitejs.dev/) + React 19 + React Router
- **Styling**: Tailwind CSS
- **i18n**: `use-intl` + `@gopdfjs/i18n`（locale 前缀路由）
- **PDF Engine**: `@pdf-lib/pdf-lib` & `pdfjs-dist`
- **Package Manager**: `pnpm`
- **Build System**: `Turbo`

## 🏁 Getting Started

### Prerequisites
- Node.js 18+
- pnpm 8+

### Installation
```bash
pnpm install
```

### Development
Start all workspaces in development mode:
```bash
pnpm dev
```

### Build
Build all workspaces for production:
```bash
pnpm build
```

## 📚 Documentation
- **Technical RFCs**: See `docs/rfc/` for tool specifications. **WASM 库目标与分层**：`docs/rfc/0058-wasm-pdf-library-charter.md`；**Worker 与矩阵**：`docs/rfc/0057-rust-wasm-worker-architecture.md`。
- **Walkthrough**: See `walkthrough.md` for a summary of recent major updates.

---
Built with ❤️ for Convenience. Perfected for You.
