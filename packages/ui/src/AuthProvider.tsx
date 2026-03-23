"use client";
import { createContext, useContext, useEffect, useState } from "react";

type User = { name: string; email: string } | null;
type AuthCtx = { user: User; login: (email: string, password: string, name?: string) => void; logout: () => void };

const AuthContext = createContext<AuthCtx>({ user: null, login: () => {}, logout: () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("pdf-auth-user");
      if (stored) setUser(JSON.parse(stored));
    } catch {}
  }, []);

  const login = (email: string, _password: string, name = email.split("@")[0]) => {
    const u = { name, email };
    setUser(u);
    localStorage.setItem("pdf-auth-user", JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("pdf-auth-user");
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
