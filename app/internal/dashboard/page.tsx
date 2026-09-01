"use client";
import Link from "next/link";
import { TrendingUp, Building2, FileText, CheckSquare, ClipboardList, ArrowRight, Circle } from "lucide-react";
import { useDeals } from "@/lib/hooks/queries";
import { useSurveys } from "@/lib/hooks/queries";
import { useApprovals } from "@/lib/hooks/queries";
import { useDocuments } from "@/lib/hooks/queries";
import { usePipelineRealtime } from "@/lib/hooks/realtime";
import { useAuth } from "@/lib/auth/context";
import {
  Card, StatCard, SkeletonCard, EmptyState, Badge, Skeleton,
} from "@/components/ui";
import {
  cn, formatCurrency, formatDate, formatRelative,
  STAGE_CONFIG, APPROVAL_STATUS_CONFIG, SURVEY_STATUS_CONFIG,
} from "@/lib/utils";

// ─── Pipeline mini-kanban ─────────────────────────────────────────────────────

function PipelineSummary() {
  const { data, isLoading } = useDeals({ limit: 50 } as any);
  const deals = data?.data ?? [];

  const stages = ["lead", "site_visit", "negotiation", "due_diligence"] as const;
  const byStage = stages.map(s => ({
    stage: s,
    cfg: STAGE_CONFIG[s],
    deals: deals.filter(d => d.stage === s),
    value: deals.filter(d => d.stage === s).reduce((a, d) => a + Number(d.value), 0),
  }));

  if (isLoading) return (
    <div className="grid grid-cols-4 gap-3">
      {stages.map(s => <Skeleton key={s} className="h-28" />)}
    </div>
  );

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {byStage.map(({ stage, cfg, deals: stageDeal, value }) => (
        <Link
          key={stage}
          href={`/internal/deals?stage=${stage}`}
          className="group"
        >
          <div className="bg-white rounded-xl border border-stone-200 p-4 hover:border-forest-300 hover:shadow-card transition-all duration-200">
            <div className="flex items-center gap-2 mb-3">
              <span className={cn("w-2 h-2 rounded-full", cfg.bg.replace("bg-", "bg-").replace("-50", "-400"))} />
              <span className={cn("text-xs font-medium font-body uppercase tracking-wider", cfg.color)}>{cfg.label}</span>
            </div>
            <p className="font-display text-2xl text-stone-900">{stageDeal.length}</p>
            <p className="text-xs text-stone-500 font-body mt-0.5">{formatCurrency(value)}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── Recent deals ─────────────────────────────────────────────────────────────

function RecentDeals() {
  const { data, isLoading } = useDeals({ limit: 5 } as any);

  if (isLoading) return <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16" />)}</div>;

  const deals = data?.data?.slice(0, 5) ?? [];
  if (!deals.length) return <EmptyState title="No active deals" icon={<Building2 className="w-10 h-10" />} />;

  return (
    <div className="divide-y divide-stone-100">
      {deals.map(deal => {
        const cfg = STAGE_CONFIG[deal.stage];
        return (
          <Link key={deal.id} href={`/internal/deals/${deal.id}`} className="flex items-center gap-4 py-3 hover:bg-stone-50 -mx-4 px-4 rounded-xl transition-colors group">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-900 font-body truncate group-hover:text-forest-700 transition-colors">
                {(deal as any).property?.name ?? "—"}
              </p>
              <p className="text-xs text-stone-500 font-body mt-0.5">{formatCurrency(deal.value, deal.currency)}</p>
            </div>
            <Badge color={cfg.color} bg={cfg.bg}>{cfg.label}</Badge>
          </Link>
        );
      })}
    </div>
  );
}

// ─── Upcoming surveys ─────────────────────────────────────────────────────────

function UpcomingSurveys() {
  const { data, isLoading } = useSurveys({ status: "scheduled", limit: "5" });

  if (isLoading) return <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14" />)}</div>;

  const surveys = data?.data?.slice(0, 5) ?? [];
  if (!surveys.length) return (
    <p className="text-sm text-stone-500 font-body py-4 text-center">No upcoming surveys</p>
  );

  return (
    <div className="divide-y divide-stone-100">
      {surveys.map(s => {
        const cfg = SURVEY_STATUS_CONFIG[s.status];
        return (
          <Link key={s.id} href={`/internal/surveys/${s.id}`} className="flex items-center gap-4 py-3 hover:bg-stone-50 -mx-4 px-4 rounded-xl transition-colors group">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-900 font-body truncate group-hover:text-forest-700 transition-colors">
                {(s as any).property?.name ?? "—"}
              </p>
              <p className="text-xs text-stone-500 font-body capitalize">{s.type.replace("_", " ")} · {formatDate(s.scheduled_date)}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ─── Pending approvals ────────────────────────────────────────────────────────

function PendingApprovals() {
  const { data, isLoading } = useApprovals({ status: "in_progress", limit: "5" });

  if (isLoading) return <div className="space-y-2">{[1,2].map(i => <Skeleton key={i} className="h-14" />)}</div>;

  const approvals = data?.data?.slice(0, 5) ?? [];
  if (!approvals.length) return (
    <p className="text-sm text-stone-500 font-body py-4 text-center">No pending approvals</p>
  );

  return (
    <div className="divide-y divide-stone-100">
      {approvals.map(a => {
        const steps = (a as any).steps ?? [];
        const approved = steps.filter((s: any) => s.status === "approved").length;
        const pct = steps.length ? Math.round((approved / steps.length) * 100) : 0;

        return (
          <Link key={a.id} href={`/internal/approvals/${a.id}`} className="flex items-center gap-4 py-3 hover:bg-stone-50 -mx-4 px-4 rounded-xl transition-colors group">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-900 font-body truncate group-hover:text-forest-700 transition-colors">
                {(a as any).workflow?.name ?? "Approval"}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-forest-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-2xs text-stone-500 font-body">{approved}/{steps.length}</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  usePipelineRealtime();
  const { user } = useAuth();

  const { data: dealsData } = useDeals({ limit: 100 } as any);
  const { data: docsData } = useDocuments({ status: "pending_review" });
  const { data: approvalsData } = useApprovals({ status: "in_progress" });
  const { data: surveysData } = useSurveys({ status: "scheduled" });

  const deals = dealsData?.data ?? [];
  const pipelineValue = (dealsData?.meta as any)?.pipeline_value ?? 0;
  const activeDeals = deals.filter(d => !["closed","lost"].includes(d.stage)).length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = user?.fullName?.split(" ")[0] ?? "";

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display text-4xl text-stone-900">{greeting}{firstName ? `, ${firstName}` : ""}.</h1>
        <p className="text-stone-500 font-body mt-1">Here's what's happening across your portfolio today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <StatCard
          label="Pipeline Value"
          value={formatCurrency(pipelineValue)}
          sub={`${activeDeals} active deals`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="forest"
        />
        <StatCard
          label="Active Deals"
          value={activeDeals}
          icon={<Building2 className="w-5 h-5" />}
          color="brass"
        />
        <StatCard
          label="Pending Docs"
          value={(docsData as any)?.meta?.total ?? "—"}
          icon={<FileText className="w-5 h-5" />}
          color="stone"
        />
        <StatCard
          label="Open Approvals"
          value={(approvalsData as any)?.meta?.total ?? "—"}
          icon={<CheckSquare className="w-5 h-5" />}
          color="stone"
        />
      </div>

      {/* Pipeline mini-kanban */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-stone-800">Pipeline</h2>
          <Link href="/internal/deals" className="flex items-center gap-1 text-sm text-forest-600 hover:text-forest-700 font-body font-medium transition-colors">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <PipelineSummary />
      </section>

      {/* Two-column grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent deals — 2/3 width */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-stone-800">Recent Deals</h2>
            <Link href="/internal/deals" className="text-xs text-forest-600 hover:text-forest-700 font-body font-medium">
              View all →
            </Link>
          </div>
          <RecentDeals />
        </Card>

        {/* Right column — 1/3 width */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl text-stone-800">Approvals</h2>
              <Link href="/internal/approvals" className="text-xs text-forest-600 font-body font-medium">View all →</Link>
            </div>
            <PendingApprovals />
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl text-stone-800">Surveys</h2>
              <Link href="/internal/surveys" className="text-xs text-forest-600 font-body font-medium">View all →</Link>
            </div>
            <UpcomingSurveys />
          </Card>
        </div>
      </div>
    </div>
  );
}
