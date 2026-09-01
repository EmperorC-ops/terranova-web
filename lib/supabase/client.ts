"use client";
// lib/supabase/client.ts — compatibility shim.
// The backend uses custom JWT auth (Edge Functions), not Supabase Auth.
// This shim keeps the original call sites compiling while routing auth
// state to the local session store. Realtime channels are inert no-ops.

import { session } from "@/lib/auth/session";

function shimUser() {
  const u = session.getUser();
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    user_metadata: { role: u.role, org_id: u.orgId, full_name: u.fullName },
  };
}

function makeChannel() {
  const ch = {
    on: (..._args: unknown[]) => ch,
    subscribe: (..._args: unknown[]) => ch,
  };
  return ch;
}

export function createClient() {
  return {
    auth: {
      getUser: async () => ({ data: { user: shimUser() } }),
      getSession: async () => {
        const token = session.getAccessToken();
        return { data: { session: token ? { access_token: token } : null } };
      },
      onAuthStateChange: (_cb: unknown) => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      signOut: async () => {
        session.clear();
      },
    },
    channel: (_name: string) => makeChannel(),
    removeChannel: (_ch: unknown) => {},
  };
}
