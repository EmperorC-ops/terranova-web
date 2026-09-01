"use client";
// lib/auth/session.ts — client-side session for the custom JWT backend.
// Tokens live in localStorage; a lightweight role cookie lets middleware
// gate routes without any server auth library.

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  orgId: string | null;
}

const KEYS = {
  access: "tn_access_token",
  refresh: "tn_refresh_token",
  user: "tn_user",
};

const isBrowser = typeof window !== "undefined";

export const session = {
  getAccessToken: (): string | null =>
    isBrowser ? window.localStorage.getItem(KEYS.access) : null,
  getRefreshToken: (): string | null =>
    isBrowser ? window.localStorage.getItem(KEYS.refresh) : null,
  getUser: (): AppUser | null => {
    if (!isBrowser) return null;
    const raw = window.localStorage.getItem(KEYS.user);
    try {
      return raw ? (JSON.parse(raw) as AppUser) : null;
    } catch {
      return null;
    }
  },
  save: (access: string, refresh: string, user: AppUser) => {
    if (!isBrowser) return;
    window.localStorage.setItem(KEYS.access, access);
    window.localStorage.setItem(KEYS.refresh, refresh);
    window.localStorage.setItem(KEYS.user, JSON.stringify(user));
    // Role cookie for middleware (not a security boundary — the API enforces auth)
    document.cookie = `tn_role=${encodeURIComponent(user.role)}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
  },
  setAccessToken: (access: string) => {
    if (isBrowser) window.localStorage.setItem(KEYS.access, access);
  },
  setRefreshToken: (refresh: string) => {
    if (isBrowser) window.localStorage.setItem(KEYS.refresh, refresh);
  },
  clear: () => {
    if (!isBrowser) return;
    Object.values(KEYS).forEach((k) => window.localStorage.removeItem(k));
    document.cookie = "tn_role=; path=/; max-age=0";
  },
};
