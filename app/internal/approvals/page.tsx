"use client";
import { useState } from "react";
import Link from "next/link";
import { CheckSquare, Clock, CheckCircle, XCircle, AlertCircle, Plus } from "lucide-react";
import { useApprovals, useWorkflows, useCreateApproval } from "@/lib/hooks/queries";
import {
  Card, Button, Select, EmptyState, Badge, Skeleton, Modal, Input,
} from "@/components/ui";
import {
  cn, formatDate, formatRelative, APPROVAL_STATUS_CONFIG,
} from "@/lib/utils";
import type { ApprovalStatus, ApprovalRequest } from "@/lib/types";
import { useForm } from "react-hook-form";

// ─── Approval card ────────────────────────────────────────────────────────────

function ApprovalCard({ request }: { request: ApprovalRequest & { progress_pct?: number } }) {
  const cfg = APPROVAL_STATUS_CONFIG[request.status];
  const steps = (request as any).steps ?? [];
  const approved = steps.filter((s: any) => s.status === "approved").length;
  const rejected = steps.filter((s: any) => s.status === "rejected").length;
  const pct = request.progress_pct ?? (steps.length ? Math.round((approved / steps.length) * 100) : 0);

  const STATUS_ICONS: Record<ApprovalStatus, React.ReactNode> = {
    pending:     <Clock       className="w-4 h-4" />,
    in_progress: <AlertCircle className="w-4 h-4" />,
    approved:    <CheckCircle className="w-4 h-4" />,
    rejected:    <XCircle     className="w-4 h-4" />,
    cancelled:   <XCircle     className="w-4 h-4" />,
  };

  return (
    <Link href={`/internal/approvals/${request.id}`}>
      <Card hover className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-stone-900 font-body">
              {(request as any).workflow?.name ?? "Approval Request"}
            </p>
            <p className="text-xs text-stone-500 font-body mt-0.5">
              {(request as any).deal?.property?.name ?? "No property linked"}
            </p>
          </div>
          <Badge color={cfg.color} bg={cfg.bg} dot>
            {cfg.label}
          </Badge>
        </div>

        {/* Progress bar */}
        {steps.length > 0 && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-stone-500 font-body">{approved}/{steps.length} steps</span>
              <span className="text-xs font-bold text-stone-700 font-body">{pct}%</span>
            </div>
            <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  rejected > 0 ? "bg-rose-500" : pct === 100 ? "bg-forest-500" : "bg-forest-400"
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {/* Step pills */}
        {steps.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {steps.map((step: any, i: number) => (
              <div
                key={step.id ?? i}
                className={cn(
                  "h-6 px-2.5 rounded-full text-2xs font-medium font-body flex items-center gap-1",
                  step.status === "approved"    ? "bg-forest-100 text-forest-700" :
                  step.status === "rejected"    ? "bg-rose-100 text-rose-700" :
                  step.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                                                  "bg-stone-100 text-stone-500"
                )}
              >
                {step.status === "approved" && <CheckCircle className="w-3 h-3" />}
                {step.status === "rejected" && <XCircle className="w-3 h-3" />}
                {step.name}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-100">
          <span className="text-2xs text-stone-400 font-body capitalize">{request.priority} priority</span>
          <span className="text-2xs text-stone-400 font-body">{formatRelative(request.created_at)}</span>
        </div>
      </Card>
    </Link>
  );
}

// ─── Create approval modal ────────────────────────────────────────────────────

function CreateApprovalModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: workflowsData } = useWorkflows();
  const create = useCreateApproval();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<{
    workflow_id: string; deal_id: string; priority: string;
  }>();

  const workflows = workflowsData?.data ?? [];

  async function onSubmit(data: any) {
    await create.mutateAsync({
      workflow_id: data.workflow_id,
      deal_id: data.deal_id || undefined,
      priority: data.priority,
    });
    reset();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Approval Request">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Select
          label="Workflow"
          placeholder="Select a workflow…"
          options={workflows.map(w => ({ value: w.id, label: w.name }))}
          {...register("workflow_id", { required: "Required" })}
          error={errors.workflow_id?.message}
        />
        <Input
          label="Deal ID (optional)"
          placeholder="Deal UUID"
          {...register("deal_id")}
        />
        <Select
          label="Priority"
          options={[
            { value: "low",    label: "Low"    },
            { value: "medium", label: "Medium" },
            { value: "high",   label: "High"   },
          ]}
          {...register("priority")}
        />
        {create.error && (
          <p className="text-sm text-rose-600 font-body">{(create.error as Error).message}</p>
        )}
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="flex-1" isLoading={create.isPending}>Create</Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ApprovalsPage() {
  const [filterStatus, setFilterStatus] = useState<ApprovalStatus | "">("");
  const [createOpen, setCreateOpen]     = useState(false);

  const query: Record<string, string> = {};
  if (filterStatus) query.status = filterStatus;

  const { data, isLoading } = useApprovals(Object.keys(query).length ? query : undefined);
  const requests = data?.data ?? [];

  const byStatus = (s: ApprovalStatus) => requests.filter(r => r.status === s).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-stone-900">Approvals</h1>
          <p className="text-stone-500 text-sm font-body mt-0.5">{requests.length} requests</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" /> Create Request
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Pending",     value: byStatus("pending")     },
          { label: "In Progress", value: byStatus("in_progress") },
          { label: "Approved",    value: byStatus("approved")    },
          { label: "Rejected",    value: byStatus("rejected")    },
        ].map(s => (
          <Card key={s.label} className="px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wider text-stone-500 font-body mb-1">{s.label}</p>
            <p className="font-display text-3xl text-stone-900">{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select
          placeholder="All statuses"
          options={[
            { value: "pending",     label: "Pending"     },
            { value: "in_progress", label: "In Progress" },
            { value: "approved",    label: "Approved"    },
            { value: "rejected",    label: "Rejected"    },
            { value: "cancelled",   label: "Cancelled"   },
          ]}
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as ApprovalStatus | "")}
          className="w-44"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="w-10 h-10" />}
          title="No approval requests"
          description="Create a request to start an approval workflow."
          action={<Button onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4" /> Create Request</Button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {requests.map(r => <ApprovalCard key={r.id} request={r} />)}
        </div>
      )}

      <CreateApprovalModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
