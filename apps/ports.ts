/**
 * Dev / e2e ports for gopdfjs apps.
 * Keep in sync with ../../port.md (ws/prj registry).
 */
export const GOPDF_PORTS = {
  /** @gopdfjs/demo-react — `pnpm --filter=@gopdfjs/demo-react dev` */
  demoDev: 5174,
  /** @gopdfjs/site — `pnpm --filter=@gopdfjs/site dev` */
  siteDev: 5175,
  /** Playwright webServer — `pnpm test:e2e` */
  demoE2e: 4174,
} as const;

export type GopdfPortKey = keyof typeof GOPDF_PORTS;
