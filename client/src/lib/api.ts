/**
 * Thin API client for the MediNova Express backend.
 * Swap VITE_API_URL to point at a deployed backend later.
 */
export const API_BASE_URL =
  (import.meta.env?.["VITE_API_URL"] as string | undefined) ?? "http://localhost:5000";

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
      return extractUser(JSON.parse(raw));
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
  fieldErrors: Record<string, string>;
  constructor(message: string, status: number, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
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
  let data: unknown = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    if (res.ok) throw new ApiError("The server returned an invalid response.", res.status);
    throw new ApiError(text || "Something went wrong.", res.status);
  }
  if (!res.ok) {
    const envelope = asRecord(data);
    const message = envelope?.["message"] ?? envelope?.["error"];
    const fieldErrors: Record<string, string> = {};
    if (Array.isArray(envelope?.["errors"])) {
      for (const entry of envelope["errors"]) {
        const error = asRecord(entry);
        const field = error?.["field"];
        const detail = error?.["message"];
        if (
          typeof field === "string" &&
          typeof detail === "string" &&
          !Object.hasOwn(fieldErrors, field)
        ) {
          Object.defineProperty(fieldErrors, field, { value: detail, enumerable: true });
        }
      }
    }
    throw new ApiError(
      typeof message === "string" ? message : "Something went wrong.",
      res.status,
      fieldErrors,
    );
  }
  return data as T;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function extractUser(payload: unknown): AuthUser {
  const envelope = asRecord(payload);
  const data = asRecord(envelope?.["data"]);
  const user = asRecord(envelope?.["user"] ?? data?.["user"] ?? envelope?.["data"] ?? payload);
  if (
    !user ||
    typeof user["name"] !== "string" ||
    typeof user["email"] !== "string" ||
    !["Patient", "Doctor", "Admin"].includes(String(user["role"]))
  ) {
    throw new ApiError("The server returned an invalid user profile.", 502);
  }
  return user as unknown as AuthUser;
}

export async function restoreSession(): Promise<AuthUser | null> {
  if (!tokenStore.get()) {
    tokenStore.clear();
    return null;
  }
  try {
    const fresh = extractUser(await apiRequest<unknown>("/api/auth/me"));
    userStore.set(fresh);
    return fresh;
  } catch (error) {
    if (error instanceof ApiError && error.status === 0) return userStore.get();
    // An expired, revoked, or malformed session must not keep the user signed in.
    tokenStore.clear();
    return null;
  }
}

/** Normalises the various shapes a login/register response may take. */
export function extractAuth(payload: Record<string, unknown>): {
  token: string;
  user: AuthUser;
} {
  const data = asRecord(payload["data"]);
  const token = payload["token"] ?? data?.["token"];
  if (typeof token !== "string" || !token) {
    throw new ApiError("The server returned an invalid authentication response.", 502);
  }
  return { token, user: extractUser(payload) };
}
