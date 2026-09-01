"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle, XCircle, Clock, AlertCircle,
  User, ChevronRight, MessageSquare,
} from "lucide-react";
import { useApproval, useDecideStep } from "@/lib/hooks/queries";
import { useApprovalRealtime } from "@/lib/hooks/realtime";
import { approvalsApi } from "@/lib/api/client";
import {
  Card, Button, Badge, Skeleton, EmptyState, Modal, Textarea,
} from "@/components/ui";
import {
  cn, formatDate, formatRelative, APPROVAL_STATUS_CONFIG,
} from "@/lib/utils";
import type { StepStatus } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";

// ─── Step card ────────────────────────────────────────────────────────────────

function StepCard({ step, requestId, isActive, canDecide }: {
  step: any;
  requestId: string;
  isActive: boolean;
  canDecide: boolean;
}) {
  const [decideOpen, setDecideOpen] = useState(false);
  const [note, setNote] = useState("");
  const [pendingDecision, setPendingDecision] = useState<"approved" | "rejected" | null>(null);
  const decide = useDecideStep();

  const STATUS_STYLES: Record<StepStatus, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
    pending:     { icon: <Clock className="w-4 h-4" />,        color: "text-stone-500",  bg: "bg-stone-100",   border: "border-stone-300"  },
    in_progress: { icon: <AlertCircle className="w-4 h-4" />,  color: "text-blue-600",   bg: "bg-blue-50",     border: "border-blue-300"   },
    approved:    { icon: <CheckCircle className="w-4 h-4" />,  color: "text-forest-600", bg: "bg-forest-50",   border: "border-forest-300" },
    rejected:    { icon: <XCircle className="w-4 h-4" />,      color: "text-rose-600",   bg: "bg-rose-50",     border: "border-rose-300"   },
    skipped:     { icon: <ChevronRight className="w-4 h-4" />, color: "text-stone-400",  bg: "bg-stone-50",    border: "border-stone-200"  },
  };

  const style = STATUS_STYLES[step.status as StepStatus] ?? STATUS_STYLES.pending;

  async function submitDecision() {
    if (!pendingDecision) return;
    await decide.mutateAsync({
      requestId,
      stepId: step.id,
      body: { decision: pendingDecision, note: note || undefined },
    });
    setDecideOpen(false);
    setNote("");
    setPendingDecision(null);
  }

  return (
    <>
      <div className={cn(
        "rounded-xl border-2 p-5 transition-all",
        isActive ? style.border + " " + style.bg : "border-stone-200 bg-white",
        step.status === "approved" && "opacity-80",
      )}>
        <div className="flex items-start gap-4">
          {/* Step number + icon */}
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
            style.bg, style.color
          )}>
            {style.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-stone-900 font-body">{step.name}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  {step.assigned_to && (
                    <span className="text-xs text-stone-500 font-body flex items-center gap-1">
                      <User className="w-3 h-3" /> {step.assigned_to.full_name}
                    </span>
                  )}
                  {step.assigned_role_slug && !step.assigned_to && (
                    <span className="text-xs text-stone-500 font-body capitalize">
                      Role: {step.assigned_role_slug}
                    </span>
                  )}
                </div>
              </div>
              <Badge color={style.color} bg={style.bg} dot>
                {step.status === "in_progress" ? "Awaiting" : step.status}
              </Badge>
            </div>

            {/* Decision info */}
            {(step.status === "approved" || step.status === "rejected") && (
              <div className="mt-3 pt-3 border-t border-stone-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-500 font-body">
                    Decided by {step.decider?.full_name ?? "—"}
                  </span>
                  {step.decided_at && (
                    <span className="text-xs text-stone-400 font-body">· {formatRelative(step.decided_at)}</span>
                  )}
                </div>
                {step.decision_note && (
                  <p className="text-sm text-stone-600 font-body mt-1.5 bg-white rounded-lg px-3 py-2 border border-stone-200">
                    {step.decision_note}
                  </p>
                )}
              </div>
            )}

            {/* Decision buttons */}
            {isActive && canDecide && (
              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  onClick={() => { setPendingDecision("approved"); setDecideOpen(true); }}
                  className="bg-forest-600 hover:bg-forest-700"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => { setPendingDecision("rejected"); setDecideOpen(true); }}
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={decideOpen}
        onClose={() => setDecideOpen(false)}
        title={pendingDecision === "approved" ? "Approve Step" : "Reject Step"}
      >
        <div className="flex flex-col gap-4">
          <div className={cn(
            "rounded-xl px-4 py-3 border",
            pendingDecision === "approved"
              ? "bg-forest-50 border-forest-200 text-forest-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          )}>
            <p className="text-sm font-medium font-body">{step.name}</p>
          </div>
          <Textarea
            label="Note (optional)"
            placeholder="Add a comment about this decision…"
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
          />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setDecideOpen(false)}>Cancel</Button>
            <Button
              className={cn("flex-1", pendingDecision === "rejected" && "bg-rose-600 hover:bg-rose-700")}
              onClick={submitDecision}
              isLoading={decide.isPending}
            >
              {pendingDecision === "approved" ? "Confirm Approval" : "Confirm Rejection"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ApprovalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: request, isLoading } = useApproval(id);
  const qc = useQueryClient();

  useApprovalRealtime(id);

  if (isLoading) return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-24" />
      <Skeleton className="h-40" />
      <Skeleton className="h-40" />
    </div>
  );

  if (!request) return (
    <EmptyState title="Request not found" description="This approval request doesn't exist or you don't have access." />
  );

  const cfg = APPROVAL_STATUS_CONFIG[request.status];
  const steps = ((request as any).steps ?? []).sort((a: any, b: any) => a.step_index - b.step_index);
  const pct = (request as any).progress_pct ?? 0;
  const currentStepIdx = request.current_step_index;
  const isResolved = ["approved", "rejected", "cancelled"].includes(request.status);

  async function cancelRequest() {
    await approvalsApi.cancel(id);
    qc.invalidateQueries({ queryKey: ["approvals"] });
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Back */}
      <Link href="/internal/approvals" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 font-body transition-colors">
        <ArrowLeft className="w-4 h-4" /> Approvals
      </Link>

      {/* Header card */}
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h1 className="font-display text-2xl text-stone-900">
              {(request as any).workflow?.name ?? "Approval Request"}
            </h1>
            {(request as any).deal?.property?.name && (
              <p className="text-sm text-stone-500 font-body mt-1">
                {(request as any).deal.property.name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge color={cfg.color} bg={cfg.bg} dot>{cfg.label}</Badge>
            {!isResolved && (
              <Button variant="ghost" size="xs" onClick={cancelRequest} className="text-stone-500 hover:text-rose-600">
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="mb-1.5 flex justify-between">
          <span className="text-xs text-stone-500 font-body">{steps.filter((s: any) => s.status === "approved").length}/{steps.length} approved</span>
          <span className="text-xs font-bold text-stone-700 font-body">{pct}%</span>
        </div>
        <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700",
              request.status === "rejected" ? "bg-rose-500" :
              pct === 100 ? "bg-forest-500" : "bg-forest-400"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Meta */}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-stone-100">
          <div>
            <p className="text-2xs text-stone-400 font-body uppercase tracking-wider">Priority</p>
            <p className="text-sm font-medium text-stone-700 font-body capitalize mt-0.5">{request.priority}</p>
          </div>
          <div>
            <p className="text-2xs text-stone-400 font-body uppercase tracking-wider">Submitted</p>
            <p className="text-sm font-medium text-stone-700 font-body mt-0.5">{formatRelative(request.created_at)}</p>
          </div>
          {request.deadline && (
            <div>
              <p className="text-2xs text-stone-400 font-body uppercase tracking-wider">Deadline</p>
              <p className="text-sm font-medium text-stone-700 font-body mt-0.5">{formatDate(request.deadline)}</p>
            </div>
          )}
          {request.resolved_at && (
            <div>
              <p className="text-2xs text-stone-400 font-body uppercase tracking-wider">Resolved</p>
              <p className="text-sm font-medium text-stone-700 font-body mt-0.5">{formatRelative(request.resolved_at)}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Steps */}
      <div>
        <h2 className="font-display text-xl text-stone-900 mb-4">Approval Steps</h2>
        <div className="space-y-3">
          {steps.map((step: any, i: number) => (
            <StepCard
              key={step.id}
              step={step}
              requestId={id}
              isActive={step.status === "in_progress" || (i === currentStepIdx && !isResolved)}
              canDecide={!isResolved && (step.status === "in_progress" || i === currentStepIdx)}
            />
          ))}
        </div>
      </div>

      {/* Resolved banner */}
      {isResolved && (
        <Card className={cn(
          "p-5 flex items-center gap-4",
          request.status === "approved" ? "bg-forest-50 border-forest-200" :
          request.status === "rejected" ? "bg-rose-50 border-rose-200" :
                                          "bg-stone-50 border-stone-200"
        )}>
          {request.status === "approved" && <CheckCircle className="w-6 h-6 text-forest-600 flex-shrink-0" />}
          {request.status === "rejected" && <XCircle    className="w-6 h-6 text-rose-600 flex-shrink-0"   />}
          <div>
            <p className="text-sm font-semibold text-stone-900 font-body">
              {request.status === "approved" ? "Request fully approved" :
               request.status === "rejected" ? "Request rejected" : "Request cancelled"}
            </p>
            {request.resolved_at && (
              <p className="text-xs text-stone-500 font-body">{formatRelative(request.resolved_at)}</p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
