import { createContext, useContext, type ReactNode } from "react";

const BasenameContext = createContext("");

/**
 * 与 Vite `base` / GitHub Pages 子路径一致，供 usePathname 从真实 pathname 中剥离前缀。
 */
export function BasenameProvider({
  basename,
  children,
}: {
  basename: string;
  children: ReactNode;
}) {
  const normalized = basename.replace(/\/$/, "");
  return (
    <BasenameContext.Provider value={normalized}>
      {children}
    </BasenameContext.Provider>
  );
}

export function useBasename(): string {
  return useContext(BasenameContext);
}
