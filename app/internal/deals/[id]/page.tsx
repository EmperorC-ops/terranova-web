"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Users, FileText, MessageSquare, Phone,
  MapPin, DollarSign, ChevronRight, Plus, Send,
} from "lucide-react";
import {
  useDeal, useDealParticipants, useDealActivity,
  useAdvanceStage, useAddActivity,
} from "@/lib/hooks/queries";
import { useDealRealtime } from "@/lib/hooks/realtime";
import {
  Card, Button, Badge, Skeleton, EmptyState, Modal, Textarea,
} from "@/components/ui";
import { DealFlowPanel } from "@/components/deals/DealFlowPanel";
import {
  cn, formatCurrency, formatDate, formatRelative,
  STAGE_CONFIG, ACTIVE_STAGES,
} from "@/lib/utils";
import type { DealStage } from "@/lib/types";

// ─── Stage stepper ────────────────────────────────────────────────────────────

function StageStepper({ currentStage, dealId }: { currentStage: DealStage; dealId: string }) {
  const advance = useAdvanceStage(dealId);
  const [noteOpen, setNoteOpen] = useState(false);
  const [pendingStage, setPendingStage] = useState<DealStage | null>(null);
  const [note, setNote] = useState("");

  const stages = Object.keys(STAGE_CONFIG) as DealStage[];
  const currentIdx = stages.indexOf(currentStage);

  function onClickStage(stage: DealStage, idx: number) {
    if (idx <= currentIdx || ["closed","lost"].includes(currentStage)) return;
    setPendingStage(stage);
    setNoteOpen(true);
  }

  async function confirmAdvance() {
    if (!pendingStage) return;
    await advance.mutateAsync({ stage: pendingStage, note: note || undefined });
    setNoteOpen(false);
    setNote("");
    setPendingStage(null);
  }

  return (
    <>
      <div className="flex items-center gap-0">
        {stages.filter(s => s !== "lost").map((stage, idx) => {
          const cfg = STAGE_CONFIG[stage];
          const status = idx < currentIdx ? "done" : idx === currentIdx ? "current" : "future";

          return (
            <div key={stage} className="flex items-center flex-1 min-w-0">
              <button
                onClick={() => onClickStage(stage, idx)}
                disabled={status === "done" || status === "current" || ["closed","lost"].includes(currentStage)}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-xl flex-1 transition-all text-left",
                  status === "current" && "bg-forest-50 border border-forest-200",
                  status === "future" && !["closed","lost"].includes(currentStage) && "hover:bg-stone-50 cursor-pointer",
                  status === "done" && "opacity-60 cursor-default",
                  status === "future" && "cursor-default",
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center text-2xs font-bold",
                  status === "done" && "bg-forest-500 border-forest-500 text-white",
                  status === "current" && "border-forest-600 bg-white text-forest-600",
                  status === "future" && "border-stone-300 bg-white text-stone-400",
                )}>
                  {status === "done" ? "✓" : idx + 1}
                </div>
                <span className={cn(
                  "text-2xs font-medium font-body text-center leading-tight hidden sm:block",
                  status === "current" ? "text-forest-700" : "text-stone-500",
                )}>
                  {cfg.label}
                </span>
              </button>
              {idx < stages.filter(s => s !== "lost").length - 1 && (
                <div className={cn("h-0.5 flex-shrink-0 w-4", idx < currentIdx ? "bg-forest-400" : "bg-stone-200")} />
              )}
            </div>
          );
        })}
      </div>

      <Modal open={noteOpen} onClose={() => setNoteOpen(false)} title={`Move to ${pendingStage ? STAGE_CONFIG[pendingStage].label : ""}`}>
        <div className="flex flex-col gap-4">
          <Textarea
            label="Note (optional)"
            placeholder="Add context about this stage change…"
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
          />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setNoteOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={confirmAdvance} isLoading={advance.isPending}>
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ─── Activity feed ────────────────────────────────────────────────────────────

function ActivityFeed({ dealId }: { dealId: string }) {
  const { data, isLoading } = useDealActivity(dealId);
  const addActivity = useAddActivity(dealId);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const activities = data?.activities ?? [];

  const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
    stage_change:    <ChevronRight className="w-3 h-3" />,
    note:            <MessageSquare className="w-3 h-3" />,
    call:            <Phone className="w-3 h-3" />,
    site_visit:      <MapPin className="w-3 h-3" />,
    document_added:  <FileText className="w-3 h-3" />,
    survey_scheduled:<FileText className="w-3 h-3" />,
  };

  async function submitNote() {
    if (!note.trim()) return;
    setSubmitting(true);
    await addActivity.mutateAsync({ type: "note", payload: { body: note.trim() } });
    setNote("");
    setSubmitting(false);
  }

  return (
    <div>
      {/* Add note */}
      <div className="flex gap-3 mb-6">
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Add a note, call summary, or site visit outcome…"
          className="flex-1 h-20 rounded-xl border border-stone-300 px-4 py-3 text-sm font-body text-stone-900 placeholder:text-stone-400 resize-none focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 transition-colors"
          onKeyDown={e => { if (e.key === "Enter" && e.metaKey) submitNote(); }}
        />
        <Button onClick={submitNote} isLoading={submitting} size="sm" className="self-end">
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-16" />)}</div>
      ) : activities.length === 0 ? (
        <EmptyState title="No activity yet" icon={<MessageSquare className="w-8 h-8" />} />
      ) : (
        <div className="relative pl-7">
          <div className="absolute left-[10px] top-2 bottom-0 w-0.5 bg-stone-200" />
          {activities.map((a, i) => {
            const payload = a.payload as any;
            return (
              <div key={a.id} className="relative mb-5 last:mb-0">
                <div className="absolute -left-7 top-0.5 w-5 h-5 rounded-full bg-white border-2 border-stone-300 flex items-center justify-center text-stone-500">
                  {ACTIVITY_ICONS[a.type] ?? <ChevronRight className="w-3 h-3" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-stone-700 font-body">
                      {(a as any).actor?.full_name ?? "System"}
                    </span>
                    <span className="text-2xs text-stone-400 font-body">{formatRelative(a.created_at)}</span>
                  </div>
                  {a.type === "stage_change" && (
                    <p className="text-sm text-stone-600 font-body">
                      Moved from <span className="font-medium">{payload.from || "start"}</span> to{" "}
                      <span className="font-medium text-forest-700">{payload.to}</span>
                      {payload.note && <span className="text-stone-500"> · {payload.note}</span>}
                    </p>
                  )}
                  {a.type === "note" && (
                    <p className="text-sm text-stone-700 font-body bg-stone-50 rounded-xl px-4 py-2.5 border border-stone-200">
                      {payload.body}
                    </p>
                  )}
                  {a.type === "call" && (
                    <p className="text-sm text-stone-600 font-body">
                      Call logged{payload.duration_minutes ? ` (${payload.duration_minutes} min)` : ""}{payload.summary ? ` · ${payload.summary}` : ""}
                    </p>
                  )}
                  {a.type === "document_added" && (
                    <p className="text-sm text-stone-600 font-body">
                      Document added: <span className="font-medium">{payload.document_name}</span>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: deal, isLoading } = useDeal(id);
  const { data: participantsData } = useDealParticipants(id);

  useDealRealtime(id);

  if (isLoading) return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-40" />
      <div className="grid lg:grid-cols-3 gap-6">
        <Skeleton className="h-80 lg:col-span-2" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );

  if (!deal) return (
    <EmptyState title="Deal not found" description="This deal doesn't exist or you don't have access." />
  );

  const cfg = STAGE_CONFIG[deal.stage];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Back + title */}
      <div>
        <Link href="/internal/deals" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 font-body mb-3 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Pipeline
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl text-stone-900">{(deal as any).property?.name ?? "-"}</h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge color={cfg.color} bg={cfg.bg}>{cfg.label}</Badge>
              <span className="text-stone-500 text-sm font-body">{(deal as any).property?.address}</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-display text-3xl text-forest-700">{formatCurrency(deal.value, deal.currency)}</p>
            {deal.expected_close_date && (
              <p className="text-xs text-stone-500 font-body mt-1">Target close: {formatDate(deal.expected_close_date)}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stage stepper */}
      <Card className="p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-stone-500 font-body mb-3">Stage Progress</p>
        <StageStepper currentStage={deal.stage} dealId={id} />
      </Card>

      <DealFlowPanel dealId={id} />

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Activity feed */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="font-display text-xl text-stone-900 mb-5">Activity</h2>
          <ActivityFeed dealId={id} />
        </Card>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Details */}
          <Card className="p-5">
            <h2 className="font-display text-lg text-stone-900 mb-4">Details</h2>
            <dl className="space-y-3">
              {[
                { label: "Type", value: deal.deal_type },
                { label: "Priority", value: deal.priority },
                { label: "Agent", value: (deal as any).assigned_agent?.full_name },
                { label: "Buyer", value: (deal as any).buyer_org?.name },
                { label: "Seller", value: (deal as any).seller_org?.name },
              ].filter(r => r.value).map(r => (
                <div key={r.label} className="flex justify-between">
                  <dt className="text-xs text-stone-500 font-body capitalize">{r.label}</dt>
                  <dd className="text-xs font-medium text-stone-800 font-body capitalize">{r.value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          {/* Participants */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg text-stone-900">Participants</h2>
              <Button variant="ghost" size="xs">
                <Plus className="w-3.5 h-3.5" /> Add
              </Button>
            </div>
            <div className="space-y-3">
              {(participantsData?.participants ?? []).map(p => (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brass-100 flex items-center justify-center text-xs font-bold text-brass-700 flex-shrink-0">
                    {(p as any).user?.full_name?.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-stone-900 font-body truncate">{(p as any).user?.full_name}</p>
                    <p className="text-xs text-stone-500 font-body capitalize">{p.role.replace("_", " ")}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
