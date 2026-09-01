"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Building2, FileText, ClipboardCheck, Calendar,
  ChevronRight, Download, Star, ArrowRight,
  CheckCircle, Clock, AlertCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { useDeals } from "@/lib/hooks/queries";
import { useSurveys } from "@/lib/hooks/queries";
import { useDocuments } from "@/lib/hooks/queries";
import { useApprovals } from "@/lib/hooks/queries";
import { useCompleteSurvey } from "@/lib/hooks/queries";
import {
  Card, Button, Badge, Skeleton, EmptyState, Modal, Textarea, Input, Spinner,
} from "@/components/ui";
import {
  cn, formatCurrency, formatDate, formatRelative, formatFileSize,
  STAGE_CONFIG, SURVEY_STATUS_CONFIG, DOC_STATUS_CONFIG, APPROVAL_STATUS_CONFIG,
} from "@/lib/utils";
import { documentsApi } from "@/lib/api/client";
import { surveysApi } from "@/lib/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import type { Survey, Document } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT VIEW — deals they're participating in
// ─────────────────────────────────────────────────────────────────────────────

function ClientPortal() {
  const { data: dealsData, isLoading: dealsLoading } = useDeals({ limit: 50 } as any);
  const deals = dealsData?.data ?? [];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="bg-gradient-to-br from-forest-800 to-stone-900 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='20' cy='20' r='1'/%3E%3C/g%3E%3C/svg%3E")` }}
        />
        <div className="relative z-10">
          <p className="text-forest-300 text-sm font-body font-medium uppercase tracking-wider mb-2">Client Portal</p>
          <h1 className="font-display text-4xl leading-tight mb-3">Your property transactions</h1>
          <p className="text-stone-400 font-body text-sm max-w-lg">
            Track the progress of your deals in real time. Your Terranova agent manages the process — this view keeps you informed at every stage.
          </p>
        </div>
      </div>

      {/* Active deals */}
      <section>
        <h2 className="font-display text-2xl text-stone-900 mb-4">Active Deals</h2>
        {dealsLoading ? (
          <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-32" />)}</div>
        ) : deals.length === 0 ? (
          <Card className="p-12">
            <EmptyState
              icon={<Building2 className="w-12 h-12" />}
              title="No active deals yet"
              description="Your agent will add you to a deal once the process begins. Check back soon."
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {deals.map(deal => {
              const cfg = STAGE_CONFIG[deal.stage];
              const stages = Object.keys(STAGE_CONFIG) as (typeof deal.stage)[];
              const currentIdx = stages.indexOf(deal.stage);
              const progress = Math.round((currentIdx / (stages.length - 1)) * 100);

              return (
                <Card key={deal.id} className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <h3 className="font-display text-xl text-stone-900">
                        {(deal as any).property?.name ?? "Property"}
                      </h3>
                      <p className="text-stone-500 text-sm font-body mt-0.5">
                        {(deal as any).property?.address}
                      </p>
                    </div>
                    <Badge color={cfg.color} bg={cfg.bg}>{cfg.label}</Badge>
                  </div>

                  {/* Progress track */}
                  <div className="mb-5">
                    <div className="flex justify-between text-xs text-stone-400 font-body mb-2">
                      <span>Started</span>
                      <span className={cn("font-medium", cfg.color)}>{cfg.label}</span>
                      <span>Closed</span>
                    </div>
                    <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-forest-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Key info */}
                  <div className="grid grid-cols-3 gap-4">
                    {deal.expected_close_date && (
                      <div className="bg-stone-50 rounded-xl p-3 border border-stone-200">
                        <p className="text-2xs text-stone-500 font-body uppercase tracking-wider mb-1">Target Close</p>
                        <p className="text-sm font-medium text-stone-800 font-body">{formatDate(deal.expected_close_date)}</p>
                      </div>
                    )}
                    {(deal as any).assigned_agent && (
                      <div className="bg-stone-50 rounded-xl p-3 border border-stone-200">
                        <p className="text-2xs text-stone-500 font-body uppercase tracking-wider mb-1">Your Agent</p>
                        <p className="text-sm font-medium text-stone-800 font-body">{(deal as any).assigned_agent.full_name}</p>
                      </div>
                    )}
                    <div className="bg-stone-50 rounded-xl p-3 border border-stone-200">
                      <p className="text-2xs text-stone-500 font-body uppercase tracking-wider mb-1">Deal Type</p>
                      <p className="text-sm font-medium text-stone-800 font-body capitalize">{deal.deal_type}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LAWYER VIEW — deals + documents + approval steps
// ─────────────────────────────────────────────────────────────────────────────

function DocumentCard({ doc }: { doc: Document }) {
  const [downloading, setDownloading] = useState(false);
  const cfg = DOC_STATUS_CONFIG[doc.status];

  async function download() {
    setDownloading(true);
    try {
      const { url } = await documentsApi.downloadUrl(doc.id);
      window.open(url, "_blank");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex items-center gap-4 py-3 px-4 hover:bg-stone-50 rounded-xl transition-colors group -mx-4">
      <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
        <FileText className="w-5 h-5 text-stone-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-stone-900 font-body truncate">{doc.name}</p>
          {doc.version > 1 && (
            <span className="text-2xs bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded font-mono flex-shrink-0">v{doc.version}</span>
          )}
        </div>
        <p className="text-xs text-stone-400 font-body mt-0.5 capitalize">
          {doc.type.replace(/_/g, " ")} · {formatDate(doc.uploaded_at)} · {formatFileSize(doc.file_size_bytes)}
        </p>
      </div>
      <Badge color={cfg.color} bg={cfg.bg}>{cfg.label}</Badge>
      <Button
        variant="ghost" size="xs"
        onClick={download}
        isLoading={downloading}
        className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
      >
        <Download className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

function LawyerPortal() {
  const { data: dealsData, isLoading: dealsLoading } = useDeals({ limit: 50 } as any);
  const { data: docsData, isLoading: docsLoading } = useDocuments();
  const { data: approvalsData } = useApprovals({ status: "in_progress" });

  const deals = dealsData?.data ?? [];
  const docs = docsData?.data ?? [];
  const approvals = approvalsData?.data ?? [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-stone-500 text-sm font-body uppercase tracking-wider font-medium mb-1">Legal Portal</p>
        <h1 className="font-display text-4xl text-stone-900">Your case files</h1>
        <p className="text-stone-500 font-body text-sm mt-2">
          Access documents shared with you and track approval steps requiring your sign-off.
        </p>
      </div>

      {/* Pending approvals — top priority */}
      {approvals.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <h2 className="font-display text-lg text-amber-900">Action Required</h2>
            <span className="ml-auto text-xs font-bold bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-body">
              {approvals.length}
            </span>
          </div>
          <div className="space-y-3">
            {approvals.map(a => {
              const pendingStep = (a as any).steps?.find((s: any) => s.status === "in_progress");
              return (
                <Link
                  key={a.id}
                  href={`/external/approvals/${a.id}`}
                  className="flex items-center gap-3 bg-white rounded-xl p-4 border border-amber-200 hover:border-amber-400 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-900 font-body">
                      {(a as any).workflow?.name ?? "Approval Request"}
                    </p>
                    {pendingStep && (
                      <p className="text-xs text-amber-700 font-body mt-0.5">
                        Awaiting your sign-off: <span className="font-medium">{pendingStep.name}</span>
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 transition-colors flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active deals */}
        <Card className="p-6">
          <h2 className="font-display text-xl text-stone-900 mb-4">Active Deals</h2>
          {dealsLoading ? (
            <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-16" />)}</div>
          ) : deals.length === 0 ? (
            <EmptyState icon={<Building2 className="w-8 h-8" />} title="No deals assigned" />
          ) : (
            <div className="space-y-3">
              {deals.map(deal => {
                const cfg = STAGE_CONFIG[deal.stage];
                return (
                  <div key={deal.id} className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-900 font-body truncate">
                        {(deal as any).property?.name}
                      </p>
                      <p className="text-xs text-stone-500 font-body mt-0.5">
                        {formatCurrency(deal.value, deal.currency)}
                      </p>
                    </div>
                    <Badge color={cfg.color} bg={cfg.bg}>{cfg.label}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Documents */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-stone-900">Documents</h2>
            <Link href="/external/documents" className="text-xs text-forest-600 font-body font-medium hover:text-forest-700">
              View all →
            </Link>
          </div>
          {docsLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>
          ) : docs.length === 0 ? (
            <EmptyState icon={<FileText className="w-8 h-8" />} title="No documents shared with you yet" />
          ) : (
            <div className="divide-y divide-stone-100">
              {docs.slice(0, 5).map(doc => <DocumentCard key={doc.id} doc={doc} />)}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SURVEYOR VIEW — assigned surveys
// ─────────────────────────────────────────────────────────────────────────────

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
    <Modal open={open} onClose={onClose} title="Submit Survey Findings">
      {survey && (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="bg-forest-50 rounded-xl p-4 border border-forest-200">
            <p className="text-sm font-semibold text-forest-900 font-body capitalize">
              {survey.type.replace(/_/g, " ")} Survey
            </p>
            <p className="text-xs text-forest-700 font-body mt-0.5">
              {(survey as any).property?.name} · {formatDate(survey.scheduled_date)}
            </p>
          </div>
          <Textarea
            label="Findings"
            placeholder="Describe observations, measurements, and conclusions in detail…"
            {...register("findings", { required: "Findings are required to complete the survey" })}
            error={errors.findings?.message}
            rows={6}
          />
          <div>
            <Input
              label="Site score (0–100)"
              type="number"
              placeholder="85"
              hint="Optional numerical rating of the site condition"
              {...register("score", {
                min: { value: 0, message: "Must be 0 or higher" },
                max: { value: 100, message: "Must be 100 or lower" },
              })}
              error={errors.score?.message}
            />
          </div>
          {complete.error && (
            <p className="text-sm text-rose-600 font-body">{(complete.error as Error).message}</p>
          )}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" isLoading={complete.isPending}>Submit Findings</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function SurveyorPortal() {
  const { data, isLoading } = useSurveys();
  const [completeTarget, setCompleteTarget] = useState<Survey | null>(null);
  const qc = useQueryClient();

  const surveys = data?.data ?? [];
  const upcoming = surveys.filter(s => s.status === "scheduled");
  const inProgress = surveys.filter(s => s.status === "in_progress");
  const completed = surveys.filter(s => s.status === "completed");

  async function cancelSurvey(id: string) {
    await surveysApi.cancel(id);
    qc.invalidateQueries({ queryKey: ["surveys"] });
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-stone-500 text-sm font-body uppercase tracking-wider font-medium mb-1">Surveyor Portal</p>
        <h1 className="font-display text-4xl text-stone-900">Your assignments</h1>
        <p className="text-stone-500 font-body text-sm mt-2">
          View your scheduled surveys and submit findings when complete.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Upcoming", count: upcoming.length, color: "text-brass-700", bg: "bg-brass-50 border-brass-200" },
          { label: "In Progress", count: inProgress.length, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
          { label: "Completed", count: completed.length, color: "text-forest-700", bg: "bg-forest-50 border-forest-200" },
        ].map(s => (
          <div key={s.label} className={cn("rounded-2xl border p-5", s.bg)}>
            <p className="text-xs font-medium uppercase tracking-wider font-body text-stone-500 mb-1">{s.label}</p>
            <p className={cn("font-display text-4xl", s.color)}>{s.count}</p>
          </div>
        ))}
      </div>

      {/* Survey list */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-36" />)}</div>
      ) : surveys.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            icon={<ClipboardCheck className="w-12 h-12" />}
            title="No surveys assigned"
            description="You'll see your survey assignments here once they're scheduled."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {surveys.map(survey => {
            const cfg = SURVEY_STATUS_CONFIG[survey.status];
            const isUpcoming = survey.status === "scheduled" || survey.status === "in_progress";

            return (
              <Card key={survey.id} className={cn("p-6", isUpcoming && "border-l-4 border-l-brass-400")}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-display text-xl text-stone-900 capitalize">
                        {survey.type.replace(/_/g, " ")} Survey
                      </h3>
                      <Badge color={cfg.color} bg={cfg.bg}>{cfg.label}</Badge>
                    </div>
                    <div className="flex items-center gap-5 text-sm text-stone-500 font-body">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4" />
                        {(survey as any).property?.name ?? "—"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {formatDate(survey.scheduled_date)}
                      </span>
                    </div>
                    {(survey as any).property?.address && (
                      <p className="text-sm text-stone-400 font-body mt-1">
                        {(survey as any).property.address}
                      </p>
                    )}
                    {survey.score !== null && (
                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={cn(
                              "w-4 h-4",
                              i < Math.round((survey.score ?? 0) / 20)
                                ? "text-brass-500 fill-brass-500"
                                : "text-stone-300"
                            )} />
                          ))}
                        </div>
                        <span className="text-sm font-medium text-stone-700 font-body">
                          {survey.score}/100
                        </span>
                      </div>
                    )}
                    {survey.status === "completed" && survey.findings && (
                      <div className="mt-3 bg-stone-50 rounded-xl p-3 border border-stone-200">
                        <p className="text-xs text-stone-500 font-body uppercase tracking-wider mb-1">Findings</p>
                        <p className="text-sm text-stone-700 font-body leading-relaxed line-clamp-3">
                          {survey.findings}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {isUpcoming && (
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button
                        onClick={() => setCompleteTarget(survey)}
                        className="whitespace-nowrap"
                      >
                        <CheckCircle className="w-4 h-4" /> Submit Findings
                      </Button>
                      {survey.status === "scheduled" && (
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => cancelSurvey(survey.id)}
                          className="text-rose-600 hover:bg-rose-50"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <CompleteSurveyModal
        survey={completeTarget}
        open={!!completeTarget}
        onClose={() => setCompleteTarget(null)}
      />
    </div>
  );
}

// ─── Router — renders correct portal based on role ────────────────────────────

export default function ExternalPortalPage() {
  const { role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (role === "lawyer")   return <LawyerPortal />;
  if (role === "surveyor") return <SurveyorPortal />;
  return <ClientPortal />;
}
