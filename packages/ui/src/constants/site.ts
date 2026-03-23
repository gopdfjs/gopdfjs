/**
 * Buy Me a Coffee profile URL. Set NEXT_PUBLIC_BUYMEACOFFEE_URL in apps/web (or host) to override.
 */
export const BUYMEACOFFEE_PAGE_URL =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_BUYMEACOFFEE_URL
    ? process.env.NEXT_PUBLIC_BUYMEACOFFEE_URL
    : "https://buymeacoffee.com/ppvb0uo";

/** Official BMC “default yellow” asset (see buymeacoffee.com embed). */
export const BUYMEACOFFEE_BUTTON_IMAGE_URL =
  "https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" as const;
