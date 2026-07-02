import { IntlProvider } from "use-intl";
import type { ReactNode } from "react";
import type { AppLocale } from "./locales";
import type { AppMessages } from "./messages";

/**
 * next-intl / use-intl root provider for Vite + React Router apps.
 * Load messages from site/messages/<locale>.json in the host app, then pass here.
 */
export function AppIntlProvider({
  locale,
  messages,
  children,
}: {
  locale: AppLocale;
  messages: AppMessages;
  children: ReactNode;
}) {
  return (
    <IntlProvider locale={locale} messages={messages}>
      {children}
    </IntlProvider>
  );
}
