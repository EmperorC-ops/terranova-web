"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle, XCircle, Clock, AlertCircle,
  ChevronRight, FileText, Building2,
} from "lucide-react";
import { useApproval, useDecideStep } from "@/lib/hooks/queries";
import { useApprovalRealtime } from "@/lib/hooks/realtime";
import { useAuth } from "@/lib/auth/context";
import {
  Card, Button, Skeleton, EmptyState, Modal, Textarea,
} from "@/components/ui";
import { cn, formatDate, formatRelative, APPROVAL_STATUS_CONFIG } from "@/lib/utils";
import type { ApprovalStep } from "@/lib/types";

// ─── Step card ────────────────────────────────────────────────────────────────

function StepCard({
  step, stepNumber, totalSteps, canDecide, onDecide,
}: {
  step: ApprovalStep;
  stepNumber: number;
  totalSteps: number;
  canDecide: boolean;
  onDecide: (stepId: string, decision: "approved" | "rejected") => void;
}) {
  const isActive   = step.status === "in_progress";
  const isApproved = step.status === "approved";
  const isRejected = step.status === "rejected";
  const isPending  = step.status === "pending";

  return (
    <div className={cn(
      "rounded-2xl border p-5 transition-all",
      isActive   && "border-brass-300 bg-brass-50 shadow-card",
      isApproved && "border-forest-200 bg-forest-50",
      isRejected && "border-rose-200 bg-rose-50",
      isPending  && "border-stone-200 bg-white opacity-60",
    )}>
      <div className="flex items-start gap-4">
        {/* Step indicator */}
        <div className={cn(
          "w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 font-bold text-sm font-body",
          isActive   && "border-brass-500 bg-brass-100 text-brass-700",
          isApproved && "border-forest-500 bg-forest-100 text-forest-700",
          isRejected && "border-rose-500 bg-rose-100 text-rose-700",
          isPending  && "border-stone-300 bg-stone-100 text-stone-400",
        )}>
          {isApproved ? <CheckCircle className="w-5 h-5" /> :
           isRejected ? <XCircle className="w-5 h-5" /> :
           isActive   ? <Clock className="w-5 h-5 animate-pulse" /> :
           stepNumber}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-stone-900 font-body">{step.name}</p>
              <p className="text-xs text-stone-500 font-body mt-0.5">
                Step {stepNumber} of {totalSteps}
                {step.assigned_role_slug && ` · ${step.assigned_role_slug}`}
              </p>
            </div>
            {isActive && canDecide && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onDecide(step.id, "rejected")}
                  className="text-rose-700 hover:bg-rose-50 border-rose-200"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </Button>
                <Button
                  size="sm"
                  onClick={() => onDecide(step.id, "approved")}
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Approve
                </Button>
              </div>
            )}
          </div>

          {/* Decision result */}
          {(isApproved || isRejected) && (
            <div className="mt-3 flex items-start gap-2">
              {isApproved && <CheckCircle className="w-4 h-4 text-forest-600 flex-shrink-0 mt-0.5" />}
              {isRejected && <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />}
              <div>
                <p className={cn(
                  "text-xs font-medium font-body",
                  isApproved ? "text-forest-700" : "text-rose-700"
                )}>
                  {isApproved ? "Approved" : "Rejected"}
                  {(step as any).decider && ` by ${(step as any).decider.full_name}`}
                </p>
                {step.decided_at && (
                  <p className="text-xs text-stone-400 font-body">{formatRelative(step.decided_at)}</p>
                )}
                {step.decision_note && (
                  <p className="text-xs text-stone-600 font-body mt-1 italic">"{step.decision_note}"</p>
                )}
              </div>
            </div>
          )}

          {isActive && !canDecide && (
            <p className="text-xs text-brass-700 font-body mt-2 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              Waiting for sign-off from {step.assigned_role_slug || "assigned reviewer"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExternalApprovalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const { data: request, isLoading } = useApproval(id);
  const decide = useDecideStep();
  useApprovalRealtime(id);

  const [pendingDecision, setPendingDecision] = useState<{
    stepId: string; decision: "approved" | "rejected";
  } | null>(null);
  const [decisionNote, setDecisionNote] = useState("");

  if (isLoading) return (
    <div className="max-w-2xl mx-auto space-y-4 pt-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40" />
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
    </div>
  );

  if (!request) return (
    <EmptyState
      title="Request not found"
      description="This approval request doesn't exist or you don't have access."
    />
  );

  const steps = ((request as any).steps ?? []).sort(
    (a: ApprovalStep, b: ApprovalStep) => a.step_index - b.step_index
  );
  const cfg = APPROVAL_STATUS_CONFIG[request.status];
  const progress_pct = (request as any).progress_pct ?? 0;
  const resolved = ["approved", "rejected", "cancelled"].includes(request.status);

  async function confirmDecision() {
    if (!pendingDecision) return;
    await decide.mutateAsync({
      requestId: id,
      stepId: pendingDecision.stepId,
      body: {
        decision: pendingDecision.decision,
        note: decisionNote || undefined,
      },
    });
    setPendingDecision(null);
    setDecisionNote("");
  }

  // Check if this user can decide the current active step
  const activeStep = steps.find((s: ApprovalStep) => s.status === "in_progress");
  const canDecideStep = activeStep && (
    role === "lawyer" ||
    activeStep.assigned_to_id === user?.id ||
    activeStep.assigned_role_slug === role
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href="/external/portal"
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 font-body mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Portal
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl text-stone-900">
              {(request as any).workflow?.name ?? "Approval Request"}
            </h1>
            {(request as any).deal?.property && (
              <p className="text-stone-500 font-body text-sm mt-1 flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                {(request as any).deal.property.name}
              </p>
            )}
          </div>
          <span className={cn(
            "px-3 py-1.5 rounded-full text-xs font-semibold font-body",
            cfg.color, cfg.bg
          )}>
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Progress */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium uppercase tracking-wider text-stone-500 font-body">Overall Progress</p>
          <p className="text-sm font-bold text-stone-900 font-body">{progress_pct}%</p>
        </div>
        <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700",
              resolved && request.status === "approved" ? "bg-forest-500" :
              resolved && request.status === "rejected" ? "bg-rose-500" :
              "bg-brass-400"
            )}
            style={{ width: `${progress_pct}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-stone-400 font-body">
          <span>{steps.filter((s: ApprovalStep) => s.status === "approved").length} approved</span>
          <span>{steps.length} total steps</span>
        </div>
      </Card>

      {/* Resolution banner */}
      {resolved && (
        <div className={cn(
          "rounded-2xl border p-5 flex items-center gap-4",
          request.status === "approved" ? "bg-forest-50 border-forest-200" :
          request.status === "rejected" ? "bg-rose-50 border-rose-200" :
          "bg-stone-50 border-stone-200"
        )}>
          {request.status === "approved" && <CheckCircle className="w-7 h-7 text-forest-600 flex-shrink-0" />}
          {request.status === "rejected" && <XCircle className="w-7 h-7 text-rose-600 flex-shrink-0" />}
          <div>
            <p className="font-semibold text-stone-900 font-body">
              {request.status === "approved" ? "All steps approved — request complete" :
               request.status === "rejected" ? "Request rejected" : "Request cancelled"}
            </p>
            {request.resolved_at && (
              <p className="text-xs text-stone-500 font-body mt-0.5">
                {formatRelative(request.resolved_at)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Steps */}
      <div className="space-y-3">
        <h2 className="font-display text-xl text-stone-900">Steps</h2>
        {steps.map((step: ApprovalStep, idx: number) => (
          <StepCard
            key={step.id}
            step={step}
            stepNumber={idx + 1}
            totalSteps={steps.length}
            canDecide={!!canDecideStep && step.status === "in_progress"}
            onDecide={(stepId, decision) => setPendingDecision({ stepId, decision })}
          />
        ))}
      </div>

      {/* Confirm decision modal */}
      <Modal
        open={!!pendingDecision}
        onClose={() => { setPendingDecision(null); setDecisionNote(""); }}
        title={pendingDecision?.decision === "approved" ? "Confirm Approval" : "Confirm Rejection"}
      >
        <div className="flex flex-col gap-4">
          <div className={cn(
            "rounded-xl border p-4 flex items-center gap-3",
            pendingDecision?.decision === "approved"
              ? "bg-forest-50 border-forest-200"
              : "bg-rose-50 border-rose-200"
          )}>
            {pendingDecision?.decision === "approved"
              ? <CheckCircle className="w-5 h-5 text-forest-600 flex-shrink-0" />
              : <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            }
            <p className="text-sm font-medium text-stone-900 font-body">
              You are about to <span className="font-bold">
                {pendingDecision?.decision}
              </span> this step. This action cannot be undone.
            </p>
          </div>
          <Textarea
            label="Note (optional)"
            placeholder={
              pendingDecision?.decision === "rejected"
                ? "Explain why this step is being rejected…"
                : "Add any comments for the record…"
            }
            value={decisionNote}
            onChange={e => setDecisionNote(e.target.value)}
            rows={3}
          />
          <div className="flex gap-3">
            <Button
              variant="secondary" className="flex-1"
              onClick={() => { setPendingDecision(null); setDecisionNote(""); }}
            >
              Cancel
            </Button>
            <Button
              className={cn(
                "flex-1",
                pendingDecision?.decision === "rejected" && "bg-rose-600 hover:bg-rose-700"
              )}
              onClick={confirmDecision}
              isLoading={decide.isPending}
            >
              {pendingDecision?.decision === "approved" ? "Confirm Approval" : "Confirm Rejection"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
