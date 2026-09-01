"use client";
import { type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, FileText, ClipboardCheck, Bell, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { cn } from "@/lib/utils";
import { useNotificationsRealtime } from "@/lib/hooks/realtime";
import { useNotifications } from "@/lib/hooks/queries";

const NAV_BY_ROLE: Record<string, { href: string; label: string; icon: React.ElementType }[]> = {
  client:   [{ href: "/external/portal", label: "My Deals", icon: Building2 }],
  lawyer:   [{ href: "/external/portal", label: "My Deals", icon: Building2 }, { href: "/external/documents", label: "Documents", icon: FileText }],
  surveyor: [{ href: "/external/portal", label: "My Surveys", icon: ClipboardCheck }, { href: "/external/documents", label: "Documents", icon: FileText }],
};

export default function ExternalLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, role, signOut } = useAuth();
  const { data: notifs } = useNotifications();
  const unread = notifs?.unread_count ?? 0;

  useNotificationsRealtime(user?.id ?? "");

  const nav = NAV_BY_ROLE[role ?? "client"] ?? NAV_BY_ROLE.client;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Top nav bar */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 bg-brass-500 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-stone-900" />
            </div>
            <span className="font-display text-xl text-stone-900 tracking-tight">Terranova</span>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-1 flex-1">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium font-body transition-all",
                    active
                      ? "bg-forest-50 text-forest-700"
                      : "text-stone-500 hover:text-stone-800 hover:bg-stone-100"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button className="p-2 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors">
                <Bell className="w-5 h-5" />
                {unread > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
                )}
              </button>
            </div>
            <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
              <div className="w-8 h-8 rounded-full bg-brass-100 flex items-center justify-center text-xs font-bold text-brass-700">
                {user?.fullName?.charAt(0) ?? "?"}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-stone-800 font-body leading-none">
                  {user?.fullName}
                </p>
                <p className="text-xs text-stone-500 font-body capitalize">{role}</p>
              </div>
              <button onClick={signOut} className="ml-2 text-stone-400 hover:text-rose-500 transition-colors p-1.5 rounded-lg hover:bg-stone-100">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
