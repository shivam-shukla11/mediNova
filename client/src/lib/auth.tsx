import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { apiRequest, extractAuth, tokenStore, userStore, type AuthUser, type Role } from "./api";

interface AuthContextValue {
  user: AuthUser | null;
  role: Role | null;
  ready: boolean;
  login: (email: string, password: string, adminId?: string) => Promise<AuthUser>;
  register: (payload: Record<string, unknown>) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const cached = userStore.get();
    if (cached) setUser(cached);
    setReady(true);
    // Revalidate against the backend in the background.
    if (tokenStore.get()) {
      apiRequest<Record<string, unknown>>("/api/auth/me")
        .then((res) => {
          const fresh = (res['user'] ?? res['data'] ?? res) as AuthUser;
          if (fresh?.role) {
            userStore.set(fresh);
            setUser(fresh);
          }
        })
        .catch(() => {
          /* keep cached session if the backend is unreachable */
        });
    }
  }, []);

  const persist = useCallback((payload: Record<string, unknown>) => {
    const { token, user: nextUser } = extractAuth(payload);
    if (token) tokenStore.set(token);
    if (nextUser) {
      userStore.set(nextUser);
      setUser(nextUser);
    }
    return nextUser;
  }, []);

  const login = useCallback(
    async (email: string, password: string, adminId?: string) => {
      const body: Record<string, unknown> = { email, password };
      if (adminId) body['adminId'] = adminId;
      const res = await apiRequest<Record<string, unknown>>("/api/auth/login", {
        method: "POST",
        auth: false,
        body,
      });
      return persist(res);
    },
    [persist],
  );

  const register = useCallback(
    async (payload: Record<string, unknown>) => {
      const res = await apiRequest<Record<string, unknown>>("/api/auth/register", {
        method: "POST",
        auth: false,
        body: payload,
      });
      return persist(res);
    },
    [persist],
  );

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, role: user?.role ?? null, ready, login, register, logout }),
    [user, ready, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function dashboardPathFor(role: Role | null | undefined) {
  if (role === "Doctor") return "/doctor";
  if (role === "Admin") return "/admin";
  return "/patient";
}