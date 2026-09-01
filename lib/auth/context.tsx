"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { session, type AppUser } from "@/lib/auth/session";
import type { UserRole } from "@/lib/types";

interface AuthContextValue {
  user: AppUser | null;
  role: UserRole | null;
  orgId: string | null;
  isLoading: boolean;
  isInternal: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null, role: null, orgId: null,
  isLoading: true, isInternal: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUser(session.getUser());
    setIsLoading(false);
  }, []);

  const role = (user?.role as UserRole) ?? null;
  const orgId = user?.orgId ?? null;
  const isInternal = role === "admin" || role === "manager" || role === "agent";

  const signOut = async () => {
    const token = session.getAccessToken();
    try {
      if (token) {
        await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + "/functions/v1/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: "{}",
        });
      }
    } catch { /* best-effort */ }
    session.clear();
    window.location.href = "/auth/login";
  };

  return (
    <AuthContext.Provider value={{ user, role, orgId, isLoading, isInternal, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useRequireRole(...roles: UserRole[]) {
  const { role } = useAuth();
  return role ? roles.includes(role) : false;
}
