import type { ReactNode } from "react";
import { BasenameProvider } from "./basename-context";
import { AppIntlProvider } from "./intl-provider";
import type { AppLocale } from "./locales";
import type { AppMessages } from "./messages";

/**
 * Standard Vite app shell: basename (GitHub Pages) + next-intl / use-intl provider.
 */
export function AppI18nShell({
  basename = "",
  locale,
  messages,
  children,
}: {
  basename?: string;
  locale: AppLocale;
  messages: AppMessages;
  children: ReactNode;
}) {
  return (
    <BasenameProvider basename={basename}>
      <AppIntlProvider locale={locale} messages={messages}>
        {children}
      </AppIntlProvider>
    </BasenameProvider>
  );
}
