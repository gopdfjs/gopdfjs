import {
  forwardRef,
  useCallback,
  type ComponentProps,
  type ReactNode,
} from "react";
import {
  Link as RouterLink,
  useNavigate,
  useLocation,
  useParams,
} from "react-router-dom";
import { useBasename } from "./basename-context";
import { joinLocalePath } from "./locale-path";
import { locales, routing, type AppLocale } from "./routing.core";

export { locales, type AppLocale, routing } from "./routing.core";

function isAppLocale(value: string): value is AppLocale {
  return (locales as readonly string[]).includes(value);
}

function useLocaleFromRoute(): string {
  const { locale } = useParams<{ locale?: string }>();
  if (locale && isAppLocale(locale)) {
    return locale;
  }
  return routing.defaultLocale;
}

function stripBasename(pathname: string, basename: string): string {
  if (!basename) {
    return pathname;
  }
  if (pathname === basename) {
    return "/";
  }
  if (pathname.startsWith(`${basename}/`)) {
    return `/${pathname.slice(basename.length + 1)}`;
  }
  return pathname;
}

export { joinLocalePath } from "./locale-path";

export const Link = forwardRef<
  HTMLAnchorElement,
  Omit<ComponentProps<"a">, "href"> & {
    href: string;
    locale?: string;
    replace?: boolean;
    children?: ReactNode;
  }
>(function I18nLink(
  { href, locale: localeProp, replace, children, ...rest },
  ref,
) {
  const current = useLocaleFromRoute();
  const loc = localeProp ?? current;
  const to = joinLocalePath(loc, href);
  return (
    <RouterLink ref={ref} to={to} replace={replace} {...rest}>
      {children}
    </RouterLink>
  );
});

export function useRouter() {
  const navigate = useNavigate();
  const locale = useLocaleFromRoute();
  const push = useCallback(
    (targetHref: string) => {
      navigate(joinLocalePath(locale, targetHref));
    },
    [navigate, locale],
  );
  const replace = useCallback(
    (targetHref: string, options?: { locale?: AppLocale }) => {
      const loc = options?.locale ?? locale;
      navigate(joinLocalePath(loc, targetHref), { replace: true });
    },
    [navigate, locale],
  );
  return { push, replace, back: () => navigate(-1) };
}

export function usePathname(): string {
  const { pathname } = useLocation();
  const basename = useBasename();
  const stripped = stripBasename(pathname, basename);
  const parts = stripped.split("/").filter(Boolean);
  if (parts.length === 0) {
    return "/";
  }
  const first = parts[0];
  if ((locales as readonly string[]).includes(first)) {
    const rest = parts.slice(1).join("/");
    return rest ? `/${rest}` : "/";
  }
  return stripped.startsWith("/") ? stripped : `/${stripped}`;
}

type HrefArg = string | { pathname: string };

export function getPathname(args: {
  href: HrefArg;
  locale: string;
  forcePrefix?: boolean;
}): string {
  void args.forcePrefix;
  const hrefStr =
    typeof args.href === "string" ? args.href : args.href.pathname;
  return joinLocalePath(args.locale, hrefStr);
}

/** 非 Next 环境：用浏览器跳转代替 RSC redirect。 */
export function redirect(target: string): never {
  if (typeof window !== "undefined") {
    window.location.assign(target);
  }
  throw new Error("redirect");
}
