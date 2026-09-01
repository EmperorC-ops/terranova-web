"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { session } from "@/lib/auth/session";
import { Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(
        process.env.NEXT_PUBLIC_SUPABASE_URL + "/functions/v1/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? "Invalid email or password. Please try again.");
        setLoading(false);
        return;
      }
      session.save(data.access_token, data.refresh_token, {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.full_name ?? data.user.email,
        role: data.user.role,
        orgId: data.user.org_id ?? null,
      });
      const isInternal = ["admin", "manager", "agent"].includes(data.user.role);
      window.location.href = isInternal ? "/internal/dashboard" : "/external/portal";
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[55%] relative bg-stone-900 flex-col justify-between p-16 overflow-hidden">
        {/* Background texture */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-forest-900/80 via-stone-900/50 to-stone-900" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brass-500 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-stone-900" />
            </div>
            <span className="font-display text-2xl text-white tracking-tight">Terranova</span>
          </div>
        </div>

        <div className="relative z-10">
          <blockquote className="font-display text-4xl text-white leading-tight mb-6">
            "Every great property transaction begins with the right team."
          </blockquote>
          <div className="flex gap-4">
            {[
              { label: "Active Deals", value: "124" },
              { label: "Properties", value: "38" },
              { label: "Close Rate", value: "68%" },
            ].map(s => (
              <div key={s.label} className="flex-1 bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                <div className="font-display text-3xl text-brass-400">{s.value}</div>
                <div className="text-xs text-stone-400 font-body mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-stone-50">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-9 h-9 bg-brass-500 rounded-xl flex items-center justify-center">
              <Building2 className="w-4.5 h-4.5 text-stone-900" />
            </div>
            <span className="font-display text-2xl text-stone-900">Terranova</span>
          </div>

          <h1 className="font-display text-3xl text-stone-900 mb-1">Welcome back</h1>
          <p className="text-stone-500 font-body text-sm mb-8">Sign in to your workspace</p>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <Input
              label="Email address"
              type="email"
              placeholder="you@terranova.io"
              value={email}
              onChange={e => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              required
              autoComplete="email"
            />
            <div className="flex flex-col gap-1.5">
              <div className="relative">
                <Input
                  label="Password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  icon={<Lock className="w-4 h-4" />}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 bottom-[9px] text-stone-400 hover:text-stone-600 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700 font-body animate-fade-in">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" isLoading={loading} className="mt-1">
              Sign in
            </Button>
          </form>

          <p className="text-xs text-stone-400 font-body text-center mt-8">
            Access is by invitation only. Contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
