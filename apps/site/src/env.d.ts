/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_URL: string;
  readonly VITE_API_BASE_URL?: string;
  readonly GITHUB_PAGES: string;
  readonly CUSTOM_DOMAIN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.wsx' {
  const content: string;
  export default content;
}
