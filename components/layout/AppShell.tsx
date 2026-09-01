"use client";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Building2, Handshake, FileText,
  ClipboardCheck, Bell, CheckSquare, LogOut,
  ChevronRight, X, Check, Circle,
} from "lucide-react";
import { cn, formatRelative } from "@/lib/utils";
import { useAuth } from "@/lib/auth/context";
import { useNotifications, useMarkRead, useMarkAllRead } from "@/lib/hooks/queries";
import { useNotificationsRealtime } from "@/lib/hooks/realtime";
import { Badge, Button, Spinner } from "@/components/ui";

// ─── Nav config ───────────────────────────────────────────────────────────────

const NAV = [
  { href: "/internal/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { href: "/internal/properties", label: "Properties", icon: Building2 },
  { href: "/internal/deals",      label: "Pipeline",   icon: Handshake },
  { href: "/internal/documents",  label: "Documents",  icon: FileText },
  { href: "/internal/surveys",    label: "Surveys",    icon: ClipboardCheck },
  { href: "/internal/approvals",  label: "Approvals",  icon: CheckSquare },
];

// ─── Notification panel ───────────────────────────────────────────────────────

function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { data, isLoading } = useNotifications();
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();

  return (
    <div className="absolute right-0 top-12 w-96 bg-white rounded-2xl border border-stone-200 shadow-2xl z-50 overflow-hidden animate-fade-up">
      <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
        <h3 className="font-display text-lg text-stone-900">Notifications</h3>
        <div className="flex items-center gap-2">
          {(data?.unread_count ?? 0) > 0 && (
            <Button variant="ghost" size="xs" onClick={() => markAll.mutate()}>
              Mark all read
            </Button>
          )}
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-h-[420px] overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : (data?.data?.length ?? 0) === 0 ? (
          <div className="py-10 text-center text-stone-500 text-sm font-body">
            <Bell className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            All caught up
          </div>
        ) : (
          data?.data?.map(n => (
            <div
              key={n.id}
              onClick={() => !n.is_read && markRead.mutate(n.id)}
              className={cn(
                "flex gap-3 px-5 py-4 border-b border-stone-50 cursor-pointer transition-colors hover:bg-stone-50",
                !n.is_read && "bg-forest-50/50"
              )}
            >
              <div className={cn(
                "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                n.is_read ? "bg-stone-200" : "bg-forest-500"
              )} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-stone-900 font-body leading-snug">{n.title}</p>
                <p className="text-xs text-stone-500 font-body mt-0.5 leading-snug">{n.body}</p>
                <p className="text-2xs text-stone-400 font-body mt-1">{formatRelative(n.created_at)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const { user, role, signOut } = useAuth();
  const { data: notifs } = useNotifications();
  const unread = notifs?.unread_count ?? 0;

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-full bg-stone-900 flex flex-col transition-all duration-300 z-40",
      collapsed ? "w-16" : "w-60"
    )}>
      {/* Logo */}
      <div className={cn(
        "flex items-center border-b border-stone-800 flex-shrink-0",
        collapsed ? "px-4 py-5 justify-center" : "px-6 py-5"
      )}>
        <div className="w-8 h-8 bg-brass-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Building2 className="w-4 h-4 text-stone-900" />
        </div>
        {!collapsed && (
          <span className="ml-3 font-display text-xl text-white tracking-tight">Terranova</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 mx-2 rounded-xl transition-all duration-150 group",
                collapsed ? "px-3 py-3 justify-center" : "px-4 py-2.5",
                active
                  ? "bg-forest-600 text-white"
                  : "text-stone-400 hover:bg-stone-800 hover:text-white"
              )}
            >
              <Icon className={cn("w-5 h-5 flex-shrink-0", active ? "text-white" : "text-stone-500 group-hover:text-white")} />
              {!collapsed && <span className="text-sm font-medium font-body">{label}</span>}
              {!collapsed && active && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className={cn(
        "border-t border-stone-800 p-3 flex-shrink-0",
        collapsed ? "flex flex-col items-center gap-2" : "flex items-center gap-3"
      )}>
        <div className="w-8 h-8 rounded-full bg-brass-600 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-white font-body">
            {user?.fullName?.charAt(0) ?? "?"}
          </span>
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-stone-100 font-body truncate">
              {user?.fullName ?? user?.email}
            </p>
            <p className="text-xs text-stone-500 font-body capitalize">{role}</p>
          </div>
        )}
        <button
          onClick={signOut}
          title="Sign out"
          className="text-stone-500 hover:text-rose-400 transition-colors p-1.5 rounded-lg hover:bg-stone-800 flex-shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className={cn(
          "absolute top-1/2 -translate-y-1/2 -right-3 w-6 h-6 bg-stone-700 border border-stone-600 rounded-full flex items-center justify-center text-stone-400 hover:text-white hover:bg-stone-600 transition-all shadow-md"
        )}
      >
        <ChevronRight className={cn("w-3 h-3 transition-transform", collapsed ? "" : "rotate-180")} />
      </button>
    </aside>
  );
}

// ─── Top bar ──────────────────────────────────────────────────────────────────

function TopBar({ pageTitle, notifOpen, onNotifToggle }: {
  pageTitle?: string; notifOpen: boolean; onNotifToggle: () => void;
}) {
  const { data: notifs } = useNotifications();
  const unread = notifs?.unread_count ?? 0;

  return (
    <header className="h-14 border-b border-stone-200 bg-white flex items-center justify-between px-6 flex-shrink-0">
      {pageTitle && (
        <h1 className="font-display text-2xl text-stone-900 leading-none">{pageTitle}</h1>
      )}
      <div className="ml-auto relative">
        <button
          onClick={onNotifToggle}
          className="relative p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse-dot" />
          )}
        </button>
        {notifOpen && <NotificationPanel onClose={onNotifToggle} />}
      </div>
    </header>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────

export function AppShell({ children, pageTitle }: { children: ReactNode; pageTitle?: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { user } = useAuth();

  useNotificationsRealtime(user?.id ?? "");

  return (
    <div className="flex h-screen overflow-hidden bg-stone-50">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div className={cn(
        "flex flex-col flex-1 min-w-0 transition-all duration-300",
        collapsed ? "ml-16" : "ml-60"
      )}>
        <TopBar
          pageTitle={pageTitle}
          notifOpen={notifOpen}
          onNotifToggle={() => setNotifOpen(o => !o)}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
