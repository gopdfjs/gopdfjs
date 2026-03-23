"use client";

import {
  BUYMEACOFFEE_BUTTON_IMAGE_URL,
  BUYMEACOFFEE_PAGE_URL,
} from "./constants/site";

type Props = {
  /** Tailwind / arbitrary classes for the wrapper `<a>` */
  className?: string;
  /** Visual size preset */
  size?: "sm" | "md";
};

/**
 * Official Buy Me a Coffee image button (opens in a new tab).
 */
export default function BuyMeCoffeeButton({ className = "", size = "md" }: Props) {
  const heightClass = size === "sm" ? "h-8" : "h-9 sm:h-10";
  return (
    <a
      href={BUYMEACOFFEE_PAGE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center shrink-0 transition-opacity hover:opacity-90 ${className}`}
    >
      <img
        src={BUYMEACOFFEE_BUTTON_IMAGE_URL}
        alt="Buy me a coffee"
        width={162}
        height={45}
        className={`${heightClass} w-auto`}
      />
    </a>
  );
}
