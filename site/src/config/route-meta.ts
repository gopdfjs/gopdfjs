/**
 * 路由 Meta 配置
 * 定义每个路由的 SEO meta 信息
 */

import type { RouteMeta } from "../utils/meta-manager";

export const routeMeta: Record<string, RouteMeta> = {
    "/": {
        title: "GoPDF.js - JSX for Native Web Components",
        description:
            "Modern JSX syntax for native Web Components. Zero dependencies, TypeScript-first, production-ready. Not a framework, just better developer experience.",
        keywords: "GoPDF.js, Web Components, JSX, TypeScript, Web Standards, Framework",
        image: "/og-image.png",
        type: "website",
    },
    "/features": {
        title: "Features - GoPDF.js",
        description:
            "Discover the powerful features of GoPDF.js: JSX syntax, TypeScript support, zero runtime overhead, and native Web Components.",
        keywords: "GoPDF.js features, Web Components features, JSX features",
        image: "/og-image.png",
    },
    "/quick-start": {
        title: "Quick Start - GoPDF.js",
        description:
            "Get started with GoPDF.js in minutes. Learn how to create your first Web Component with JSX syntax.",
        keywords: "GoPDF.js quick start, GoPDF.js tutorial, get started with GoPDF.js",
        image: "/og-image.png",
    },
    "/examples": {
        title: "Examples - GoPDF.js",
        description:
            "Explore interactive examples showcasing GoPDF.js capabilities: Web Components, Light Components, Slots, and more.",
        keywords: "GoPDF.js examples, Web Components examples, JSX examples",
        image: "/og-image.png",
    },
    "/use-cases": {
        title: "Use Cases - GoPDF.js",
        description:
            "See how GoPDF.js can be used in real-world scenarios: component libraries, applications, and integrations.",
        keywords: "GoPDF.js use cases, Web Components use cases",
        image: "/og-image.png",
    },
    "/webcomponent-examples": {
        title: "WebComponent Examples - GoPDF.js",
        description: "Learn how to use WebComponent base class with Shadow DOM in GoPDF.js.",
        keywords: "GoPDF.js WebComponent, Shadow DOM, Web Components",
        image: "/og-image.png",
    },
    "/lightcomponent-examples": {
        title: "LightComponent Examples - GoPDF.js",
        description: "Learn how to use LightComponent base class with Light DOM in GoPDF.js.",
        keywords: "GoPDF.js LightComponent, Light DOM, Web Components",
        image: "/og-image.png",
    },
    "/slot-examples": {
        title: "Slot Examples - GoPDF.js",
        description: "Learn how to use slots for component composition in GoPDF.js.",
        keywords: "GoPDF.js slots, component composition, Web Components slots",
        image: "/og-image.png",
    },
    "/marked": {
        title: "Markdown Renderer - GoPDF.js",
        description:
            "See how to render Markdown with WSX custom elements using the marked library.",
        keywords: "GoPDF.js markdown, marked library, custom renderer",
        image: "/og-image.png",
    },
    "/ecosystem": {
        title: "Ecosystem - GoPDF.js",
        description: "Explore the GoPDF.js ecosystem: packages, tools, and community resources.",
        keywords: "GoPDF.js ecosystem, GoPDF.js packages, GoPDF.js tools",
        image: "/og-image.png",
    },
    "/docs": {
        title: "Documentation - GoPDF.js",
        description:
            "Complete documentation for GoPDF.js framework, including guides, API reference, and examples.",
        keywords: "GoPDF.js documentation, GoPDF.js guide, GoPDF.js API",
        image: "/og-image.png",
    },
    "/privacy": {
        title: "Privacy Policy - GoPDF.js",
        description: "GoPDF.js Privacy Policy - How we collect, use, and protect your data.",
        keywords: "GoPDF.js privacy policy",
        image: "/og-image.png",
    },
    "/terms": {
        title: "Terms of Service - GoPDF.js",
        description: "GoPDF.js Terms of Service - Legal terms and conditions for using GoPDF.js.",
        keywords: "GoPDF.js terms of service",
        image: "/og-image.png",
    },
    // 404 页面（通配符路由）
    "*": {
        title: "404 - Page Not Found | GoPDF.js",
        description: "The page you're looking for doesn't exist or has been moved.",
        keywords: "404, page not found, GoPDF.js",
        image: "/og-image.png",
    },
};

/**
 * 获取路由的 meta 信息
 * 优先检查精确匹配，然后检查参数化路由（如 /docs/:category/:page），最后是通配符 "*"，最后回退到首页
 */
export function getRouteMeta(path: string): RouteMeta {
    // 1. 优先返回精确匹配的路由 meta
    if (routeMeta[path]) {
        return routeMeta[path];
    }
    // 2. 检查文档路由：/docs/* (支持多级路径)
    if (path.startsWith("/docs/")) {
        // 支持多级路径，例如：/docs/guide/essentials/getting-started
        const docPath = path.slice(6); // 移除 "/docs/" 前缀
        if (docPath) {
            // 使用文档路由的 meta，但可以根据需要动态生成标题
            const baseMeta = routeMeta["/docs"] || routeMeta["/"];
            // 从路径中提取最后一个部分作为标题（如果没有元数据）
            const lastPart = docPath.split("/").pop() || docPath;
            return {
                ...baseMeta,
                title: `${lastPart} - Documentation | GoPDF.js`,
                description: baseMeta.description || "GoPDF.js Documentation",
            };
        }
    }
    // 3. 如果没有精确匹配，检查通配符 "*"（用于 404 页面）
    if (routeMeta["*"]) {
        return routeMeta["*"];
    }
    // 4. 最后回退到首页 meta
    return routeMeta["/"];
}
