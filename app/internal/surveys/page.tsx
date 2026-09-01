"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Plus, Search, ClipboardCheck, Calendar, User,
  CheckCircle, XCircle, ArrowLeft, Star,
} from "lucide-react";
import {
  useSurveys, useCreateSurvey, useCompleteSurvey, useSurvey,
} from "@/lib/hooks/queries";
import { surveysApi } from "@/lib/api/client";
import { useParams } from "next/navigation";
import {
  Card, Button, Input, Select, EmptyState, Badge, Skeleton,
  Modal, Textarea, StatCard,
} from "@/components/ui";
import {
  cn, formatDate, formatRelative, SURVEY_STATUS_CONFIG,
} from "@/lib/utils";
import type { SurveyType, SurveyStatus, Survey } from "@/lib/types";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";

// ─── Survey row ───────────────────────────────────────────────────────────────

function SurveyRow({ survey, onComplete, onCancel }: {
  survey: Survey;
  onComplete: (s: Survey) => void;
  onCancel: (id: string) => void;
}) {
  const cfg = SURVEY_STATUS_CONFIG[survey.status];
  const canComplete = survey.status === "scheduled" || survey.status === "in_progress";
  const canCancel   = survey.status === "scheduled";

  return (
    <div className="flex items-center gap-4 px-5 py-4 hover:bg-stone-50 transition-colors group border-b border-stone-100 last:border-0">
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
        cfg.bg, cfg.color
      )}>
        <ClipboardCheck className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <p className="text-sm font-semibold text-stone-900 font-body capitalize">
            {survey.type.replace(/_/g, " ")} Survey
          </p>
          <Badge color={cfg.color} bg={cfg.bg}>{cfg.label}</Badge>
        </div>
        <div className="flex items-center gap-4 mt-0.5">
          <span className="text-xs text-stone-500 font-body flex items-center gap-1">
            <ClipboardCheck className="w-3 h-3" />
            {(survey as any).property?.name ?? "—"}
          </span>
          <span className="text-xs text-stone-500 font-body flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(survey.scheduled_date)}
          </span>
          {(survey as any).assigned_to && (
            <span className="text-xs text-stone-500 font-body flex items-center gap-1">
              <User className="w-3 h-3" />
              {(survey as any).assigned_to.full_name}
            </span>
          )}
        </div>
      </div>
      {survey.score !== null && (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Star className="w-3.5 h-3.5 text-brass-500 fill-brass-500" />
          <span className="text-sm font-bold text-stone-900 font-body">{survey.score}/100</span>
        </div>
      )}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        {canComplete && (
          <Button variant="ghost" size="xs" onClick={() => onComplete(survey)} className="text-forest-700 hover:bg-forest-50">
            <CheckCircle className="w-3.5 h-3.5" /> Complete
          </Button>
        )}
        {canCancel && (
          <Button variant="ghost" size="xs" onClick={() => onCancel(survey.id)} className="text-rose-600 hover:bg-rose-50">
            <XCircle className="w-3.5 h-3.5" /> Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Complete survey modal ────────────────────────────────────────────────────

function CompleteSurveyModal({ survey, open, onClose }: {
  survey: Survey | null; open: boolean; onClose: () => void;
}) {
  const complete = useCompleteSurvey(survey?.id ?? "");
  const { register, handleSubmit, reset, formState: { errors } } = useForm<{
    findings: string; score: string;
  }>();

  async function onSubmit(data: any) {
    await complete.mutateAsync({
      findings: data.findings,
      score: data.score ? Number(data.score) : undefined,
    });
    reset();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Complete Survey">
      {survey && (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="bg-stone-50 rounded-xl p-3 border border-stone-200">
            <p className="text-sm font-medium text-stone-800 font-body capitalize">
              {survey.type.replace(/_/g, " ")} · {(survey as any).property?.name}
            </p>
            <p className="text-xs text-stone-500 font-body">{formatDate(survey.scheduled_date)}</p>
          </div>
          <Textarea
            label="Findings"
            placeholder="Describe the survey findings in detail…"
            {...register("findings", { required: "Findings are required" })}
            error={errors.findings?.message}
            rows={5}
          />
          <Input
            label="Site score (0–100)"
            type="number"
            placeholder="85"
            hint="Optional numerical rating of the site"
            {...register("score", {
              min: { value: 0, message: "Must be ≥ 0" },
              max: { value: 100, message: "Must be ≤ 100" },
            })}
            error={errors.score?.message}
          />
          {complete.error && (
            <p className="text-sm text-rose-600 font-body">{(complete.error as Error).message}</p>
          )}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" isLoading={complete.isPending}>Submit Survey</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

// ─── Schedule survey modal ────────────────────────────────────────────────────

function ScheduleSurveyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateSurvey();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<{
    property_id: string; assigned_to_id: string;
    type: SurveyType; scheduled_date: string; deal_id: string;
  }>();

  async function onSubmit(data: any) {
    await create.mutateAsync({
      property_id: data.property_id,
      assigned_to_id: data.assigned_to_id,
      type: data.type,
      scheduled_date: data.scheduled_date,
      deal_id: data.deal_id || undefined,
    });
    reset();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Schedule Survey">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Property ID"
          placeholder="Property UUID"
          {...register("property_id", { required: "Required" })}
          error={errors.property_id?.message}
        />
        <Input
          label="Deal ID (optional)"
          placeholder="Deal UUID"
          {...register("deal_id")}
        />
        <Select
          label="Survey type"
          options={[
            { value: "structural",    label: "Structural"    },
            { value: "environmental", label: "Environmental" },
            { value: "topographic",   label: "Topographic"   },
            { value: "valuation",     label: "Valuation"     },
            { value: "boundary",      label: "Boundary"      },
          ]}
          {...register("type", { required: true })}
        />
        <Input
          label="Assigned surveyor ID"
          placeholder="User UUID"
          {...register("assigned_to_id", { required: "Required" })}
          error={errors.assigned_to_id?.message}
        />
        <Input
          label="Scheduled date"
          type="date"
          {...register("scheduled_date", { required: "Required" })}
          error={errors.scheduled_date?.message}
        />
        {create.error && (
          <p className="text-sm text-rose-600 font-body">{(create.error as Error).message}</p>
        )}
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="flex-1" isLoading={create.isPending}>Schedule</Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SurveysPage() {
  const [filterStatus, setFilterStatus] = useState<SurveyStatus | "">("");
  const [filterType, setFilterType]     = useState<SurveyType | "">("");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [completeTarget, setCompleteTarget] = useState<Survey | null>(null);
  const qc = useQueryClient();

  const query: Record<string, string> = {};
  if (filterStatus) query.status = filterStatus;
  if (filterType)   query.type   = filterType;

  const { data, isLoading } = useSurveys(Object.keys(query).length ? query : undefined);
  const surveys = data?.data ?? [];

  const byStatus = (s: SurveyStatus) => surveys.filter(sv => sv.status === s).length;

  async function cancelSurvey(id: string) {
    await surveysApi.cancel(id);
    qc.invalidateQueries({ queryKey: ["surveys"] });
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-stone-900">Surveys</h1>
          <p className="text-stone-500 text-sm font-body mt-0.5">{surveys.length} surveys total</p>
        </div>
        <Button onClick={() => setScheduleOpen(true)}>
          <Plus className="w-4 h-4" /> Schedule Survey
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Scheduled",   value: byStatus("scheduled"),   color: "brass" },
          { label: "In Progress", value: byStatus("in_progress"), color: "stone" },
          { label: "Completed",   value: byStatus("completed"),   color: "forest" },
          { label: "Cancelled",   value: byStatus("cancelled"),   color: "stone" },
        ].map(s => (
          <Card key={s.label} className="px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wider text-stone-500 font-body mb-1">{s.label}</p>
            <p className="font-display text-3xl text-stone-900">{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select
          placeholder="All statuses"
          options={[
            { value: "scheduled",   label: "Scheduled"   },
            { value: "in_progress", label: "In Progress" },
            { value: "completed",   label: "Completed"   },
            { value: "cancelled",   label: "Cancelled"   },
          ]}
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as SurveyStatus | "")}
          className="w-44"
        />
        <Select
          placeholder="All types"
          options={[
            { value: "structural",    label: "Structural"    },
            { value: "environmental", label: "Environmental" },
            { value: "topographic",   label: "Topographic"   },
            { value: "valuation",     label: "Valuation"     },
            { value: "boundary",      label: "Boundary"      },
          ]}
          value={filterType}
          onChange={e => setFilterType(e.target.value as SurveyType | "")}
          className="w-44"
        />
      </div>

      {/* List */}
      <Card>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : surveys.length === 0 ? (
          <EmptyState
            icon={<ClipboardCheck className="w-10 h-10" />}
            title="No surveys found"
            description="Schedule a survey to get started."
            action={<Button onClick={() => setScheduleOpen(true)}><Plus className="w-4 h-4" /> Schedule Survey</Button>}
          />
        ) : (
          surveys.map(s => (
            <SurveyRow
              key={s.id}
              survey={s}
              onComplete={sv => setCompleteTarget(sv)}
              onCancel={cancelSurvey}
            />
          ))
        )}
      </Card>

      <ScheduleSurveyModal open={scheduleOpen} onClose={() => setScheduleOpen(false)} />
      <CompleteSurveyModal
        survey={completeTarget}
        open={!!completeTarget}
        onClose={() => setCompleteTarget(null)}
      />
    </div>
  );
}
