/**
 * Thin API client for the MediNova Express backend.
 * Swap VITE_API_URL to point at a deployed backend later.
 */
export const API_BASE_URL =
  (import.meta.env['VITE_API_URL'] as string | undefined) ?? "http://localhost:5000";

const TOKEN_KEY = "medinova.token";
const USER_KEY = "medinova.user";

export type Role = "Patient" | "Doctor" | "Admin";

export interface AuthUser {
  _id?: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  department?: string;
  specialization?: string;
  [key: string]: unknown;
}

export const tokenStore = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },
  set(token: string) {
    window.localStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  },
};

export const userStore = {
  get(): AuthUser | null {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },
  set(user: AuthUser) {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiRequest<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const { method = "GET", body, auth = true } = options;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = tokenStore.get();
  if (auth && token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    const init: RequestInit = { method, headers };
    if (body !== undefined) init.body = JSON.stringify(body);
    res = await fetch(`${API_BASE_URL}${path}`, init);
  } catch {
    throw new ApiError("Cannot reach the MediNova server. Is the backend running?", 0);
  }

  const text = await res.text();
  const data = text ? (JSON.parse(text) as Record<string, unknown>) : {};

  if (!res.ok) {
    const message =
      (data['message'] as string) || (data['error'] as string) || "Something went wrong.";
    throw new ApiError(message, res.status);
  }
  return data as T;
}

/** Normalises the various shapes a login/register response may take. */
export function extractAuth(payload: Record<string, unknown>): {
  token: string;
  user: AuthUser;
} {
  const token = (payload['token'] ?? (payload['data'] as any)?.token) as string;
  const user = (payload['user'] ?? (payload['data'] as any)?.user ?? payload['data']) as AuthUser;
  return { token, user };
}