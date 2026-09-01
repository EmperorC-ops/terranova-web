"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Building2, User, Calendar, Star,
  CheckCircle, XCircle, FileText, MapPin, ClipboardCheck,
} from "lucide-react";
import { useSurvey, useCompleteSurvey } from "@/lib/hooks/queries";
import { surveysApi } from "@/lib/api/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  Card, Button, Badge, Skeleton, EmptyState, Modal, Textarea, Input,
} from "@/components/ui";
import {
  cn, formatDate, formatRelative, SURVEY_STATUS_CONFIG,
} from "@/lib/utils";
import { useForm } from "react-hook-form";

export default function SurveyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: survey, isLoading } = useSurvey(id);
  const complete = useCompleteSurvey(id);
  const qc = useQueryClient();
  const [completeOpen, setCompleteOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{
    findings: string; score: string;
  }>();

  async function onComplete(data: any) {
    await complete.mutateAsync({
      findings: data.findings,
      score: data.score ? Number(data.score) : undefined,
    });
    reset();
    setCompleteOpen(false);
  }

  async function onCancel() {
    setCancelling(true);
    try {
      await surveysApi.cancel(id);
      qc.invalidateQueries({ queryKey: ["surveys", id] });
    } finally {
      setCancelling(false);
    }
  }

  if (isLoading) return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40" />
      <div className="grid lg:grid-cols-3 gap-6">
        <Skeleton className="h-60 lg:col-span-2" />
        <Skeleton className="h-60" />
      </div>
    </div>
  );

  if (!survey) return (
    <EmptyState title="Survey not found" description="This survey doesn't exist or you don't have access." />
  );

  const cfg = SURVEY_STATUS_CONFIG[survey.status];
  const canComplete = survey.status === "scheduled" || survey.status === "in_progress";
  const canCancel   = survey.status === "scheduled";

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Back */}
      <div>
        <Link href="/internal/surveys" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 font-body mb-3 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Surveys
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl text-stone-900 capitalize">
              {survey.type.replace(/_/g, " ")} Survey
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge color={cfg.color} bg={cfg.bg}>{cfg.label}</Badge>
              {(survey as any).property && (
                <span className="text-sm text-stone-500 font-body flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" />
                  {(survey as any).property.name}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canComplete && (
              <Button onClick={() => setCompleteOpen(true)}>
                <CheckCircle className="w-4 h-4" /> Complete Survey
              </Button>
            )}
            {canCancel && (
              <Button variant="outline" onClick={onCancel} isLoading={cancelling} className="text-rose-600 border-rose-200 hover:bg-rose-50">
                <XCircle className="w-4 h-4" /> Cancel
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Score banner — shown after completion */}
      {survey.status === "completed" && survey.score !== null && (
        <div className="bg-gradient-to-r from-forest-800 to-forest-700 rounded-2xl p-6 text-white flex items-center gap-6">
          <div>
            <p className="text-forest-300 text-xs font-body uppercase tracking-wider mb-1">Site Score</p>
            <p className="font-display text-6xl text-white">{survey.score}</p>
            <p className="text-forest-300 text-sm font-body">/100</p>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={cn(
                "w-6 h-6",
                i < Math.round((survey.score ?? 0) / 20)
                  ? "text-brass-400 fill-brass-400"
                  : "text-forest-600"
              )} />
            ))}
          </div>
          {survey.completed_date && (
            <p className="text-forest-300 text-sm font-body ml-auto">
              Completed {formatDate(survey.completed_date)}
            </p>
          )}
        </div>
      )}

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Findings */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="font-display text-xl text-stone-900 mb-4">Findings</h2>
          {survey.findings ? (
            <div className="prose prose-sm prose-stone max-w-none">
              <p className="text-stone-700 font-body leading-relaxed whitespace-pre-wrap">
                {survey.findings}
              </p>
            </div>
          ) : (
            <div className="py-10 text-center">
              <ClipboardCheck className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <p className="text-stone-500 font-body text-sm">
                {canComplete
                  ? 'No findings yet. Click "Complete Survey" to submit.'
                  : "Findings will appear here once the survey is completed."}
              </p>
            </div>
          )}

          {/* Report document */}
          {(survey as any).report && (
            <div className="mt-6 pt-6 border-t border-stone-200">
              <p className="text-xs font-medium uppercase tracking-wider text-stone-500 font-body mb-3">Attached Report</p>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-stone-50 border border-stone-200">
                <FileText className="w-5 h-5 text-stone-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-900 font-body truncate">
                    {(survey as any).report.name}
                  </p>
                  <p className="text-xs text-stone-500 font-body capitalize">{(survey as any).report.status}</p>
                </div>
                <Button variant="ghost" size="sm">
                  <FileText className="w-4 h-4" /> View
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Details sidebar */}
        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="font-display text-lg text-stone-900 mb-4">Details</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-xs text-stone-500 font-body uppercase tracking-wider mb-1">Property</dt>
                <dd className="text-sm font-medium text-stone-800 font-body">
                  {(survey as any).property?.name ?? "—"}
                </dd>
                {(survey as any).property?.address && (
                  <dd className="text-xs text-stone-400 font-body mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />{(survey as any).property.address}
                  </dd>
                )}
              </div>

              <div>
                <dt className="text-xs text-stone-500 font-body uppercase tracking-wider mb-1">Assigned to</dt>
                <dd className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-brass-100 flex items-center justify-center text-xs font-bold text-brass-700 flex-shrink-0">
                    {(survey as any).assigned_to?.full_name?.charAt(0) ?? "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-800 font-body">
                      {(survey as any).assigned_to?.full_name ?? "—"}
                    </p>
                    {(survey as any).assigned_org && (
                      <p className="text-xs text-stone-500 font-body">{(survey as any).assigned_org.name}</p>
                    )}
                  </div>
                </dd>
              </div>

              <div>
                <dt className="text-xs text-stone-500 font-body uppercase tracking-wider mb-1">Scheduled</dt>
                <dd className="text-sm font-medium text-stone-800 font-body flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-stone-400" />
                  {formatDate(survey.scheduled_date)}
                </dd>
              </div>

              {survey.completed_date && (
                <div>
                  <dt className="text-xs text-stone-500 font-body uppercase tracking-wider mb-1">Completed</dt>
                  <dd className="text-sm font-medium text-forest-700 font-body flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    {formatDate(survey.completed_date)}
                  </dd>
                </div>
              )}

              {survey.type && (
                <div>
                  <dt className="text-xs text-stone-500 font-body uppercase tracking-wider mb-1">Type</dt>
                  <dd className="text-sm font-medium text-stone-800 font-body capitalize">
                    {survey.type.replace(/_/g, " ")}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          {/* Linked deal */}
          {(survey as any).deal && (
            <Card className="p-5">
              <h2 className="font-display text-lg text-stone-900 mb-3">Linked Deal</h2>
              <Link
                href={`/internal/deals/${(survey as any).deal.id}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200 hover:border-forest-300 hover:bg-forest-50 transition-all group"
              >
                <Building2 className="w-5 h-5 text-stone-500 group-hover:text-forest-600 transition-colors flex-shrink-0" />
                <p className="text-sm font-medium text-stone-800 group-hover:text-forest-700 font-body transition-colors">
                  View deal →
                </p>
              </Link>
            </Card>
          )}
        </div>
      </div>

      {/* Complete survey modal */}
      <Modal open={completeOpen} onClose={() => setCompleteOpen(false)} title="Submit Survey Findings">
        <form onSubmit={handleSubmit(onComplete)} className="flex flex-col gap-4">
          <Textarea
            label="Findings"
            placeholder="Describe observations, structural assessments, environmental notes, and recommendations in detail…"
            {...register("findings", { required: "Findings are required" })}
            error={errors.findings?.message}
            rows={6}
          />
          <Input
            label="Site score (0–100)"
            type="number"
            placeholder="85"
            hint="An overall numerical rating of the site condition"
            {...register("score", {
              min: { value: 0, message: "Must be 0 or higher" },
              max: { value: 100, message: "Must be 100 or lower" },
            })}
            error={errors.score?.message}
          />
          {complete.error && (
            <p className="text-sm text-rose-600 font-body">{(complete.error as Error).message}</p>
          )}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setCompleteOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" isLoading={complete.isPending}>
              Submit Survey
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
