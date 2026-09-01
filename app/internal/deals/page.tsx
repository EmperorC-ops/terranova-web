"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Filter, Building2, TrendingUp, Calendar } from "lucide-react";
import { useDeals, useCreateDeal, useAdvanceStage } from "@/lib/hooks/queries";
import { usePipelineRealtime } from "@/lib/hooks/realtime";
import {
  Button, Input, Select, Card, Skeleton, EmptyState, Badge, Modal, Spinner,
} from "@/components/ui";
import {
  cn, formatCurrency, formatDate, formatRelative,
  STAGE_CONFIG, ACTIVE_STAGES,
} from "@/lib/utils";
import type { DealStage, Deal } from "@/lib/types";
import { useForm } from "react-hook-form";

// ─── Deal card ────────────────────────────────────────────────────────────────

function DealCard({ deal, onStageChange }: { deal: Deal; onStageChange: (d: Deal, s: DealStage) => void }) {
  const stages = Object.keys(STAGE_CONFIG) as DealStage[];
  const currentIdx = stages.indexOf(deal.stage);
  const nextStage = currentIdx < stages.length - 1 ? stages[currentIdx + 1] : null;
  const canAdvance = nextStage && !["closed","lost"].includes(deal.stage);

  return (
    <div className="kanban-card bg-white rounded-xl border border-stone-200 p-4 shadow-card cursor-pointer group">
      <Link href={`/internal/deals/${deal.id}`} className="block">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-sm font-semibold text-stone-900 font-body leading-snug group-hover:text-forest-700 transition-colors">
            {(deal as any).property?.name ?? "—"}
          </h3>
          <span className={cn(
            "text-2xs font-bold px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0",
            deal.priority === "high" ? "bg-rose-100 text-rose-700" :
            deal.priority === "medium" ? "bg-brass-100 text-brass-700" : "bg-stone-100 text-stone-600"
          )}>{deal.priority}</span>
        </div>
        <p className="font-display text-lg text-forest-700">{formatCurrency(deal.value, deal.currency)}</p>
        {(deal as any).assigned_agent && (
          <div className="flex items-center gap-2 mt-3">
            <div className="w-5 h-5 rounded-full bg-stone-200 flex items-center justify-center text-2xs font-bold text-stone-600">
              {(deal as any).assigned_agent.full_name?.charAt(0)}
            </div>
            <span className="text-xs text-stone-500 font-body">{(deal as any).assigned_agent.full_name}</span>
          </div>
        )}
        {deal.expected_close_date && (
          <div className="flex items-center gap-1 mt-2 text-2xs text-stone-400 font-body">
            <Calendar className="w-3 h-3" />
            {formatDate(deal.expected_close_date)}
          </div>
        )}
      </Link>
      {canAdvance && nextStage && (
        <button
          onClick={e => { e.stopPropagation(); onStageChange(deal, nextStage); }}
          className="mt-3 w-full text-xs py-1.5 px-3 rounded-lg border border-forest-200 text-forest-700 hover:bg-forest-50 hover:border-forest-300 font-body font-medium transition-all"
        >
          → {STAGE_CONFIG[nextStage].label}
        </button>
      )}
    </div>
  );
}

// ─── Stage column ─────────────────────────────────────────────────────────────

function StageColumn({ stage, deals, onStageChange, isLoading }: {
  stage: DealStage;
  deals: Deal[];
  onStageChange: (d: Deal, s: DealStage) => void;
  isLoading: boolean;
}) {
  const cfg = STAGE_CONFIG[stage];
  const totalValue = deals.reduce((a, d) => a + Number(d.value), 0);

  return (
    <div className="flex flex-col min-w-[260px] max-w-[300px]">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", cfg.bg.replace("-50", "-400"))} />
          <span className={cn("text-xs font-semibold uppercase tracking-wider font-body", cfg.color)}>
            {cfg.label}
          </span>
          <span className="bg-stone-100 text-stone-600 text-xs font-bold px-1.5 py-0.5 rounded font-body">
            {deals.length}
          </span>
        </div>
        <span className="text-xs text-stone-400 font-body">{formatCurrency(totalValue)}</span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-3 flex-1">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-32" />)
        ) : deals.length === 0 ? (
          <div className="border-2 border-dashed border-stone-200 rounded-xl h-24 flex items-center justify-center text-xs text-stone-400 font-body">
            No deals
          </div>
        ) : (
          deals.map(d => (
            <DealCard key={d.id} deal={d} onStageChange={onStageChange} />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Create deal modal ────────────────────────────────────────────────────────

function CreateDealModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateDeal();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<{
    property_id: string; value: string; deal_type: string; priority: string; assigned_agent_id: string;
  }>();

  async function onSubmit(data: any) {
    await create.mutateAsync({
      property_id: data.property_id,
      value: Number(data.value),
      deal_type: data.deal_type,
      priority: data.priority,
      assigned_agent_id: data.assigned_agent_id,
    });
    reset();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Open New Deal">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Property ID"
          placeholder="Property UUID"
          hint="Paste the property ID from the Properties page"
          {...register("property_id", { required: "Required" })}
          error={errors.property_id?.message}
        />
        <Input
          label="Deal Value (USD)"
          type="number"
          placeholder="2500000"
          {...register("value", { required: "Required", min: { value: 1, message: "Must be > 0" } })}
          error={errors.value?.message}
        />
        <Select
          label="Deal Type"
          options={[
            { value: "sale", label: "Sale" },
            { value: "lease", label: "Lease" },
            { value: "acquisition", label: "Acquisition" },
          ]}
          {...register("deal_type")}
        />
        <Select
          label="Priority"
          options={[
            { value: "low", label: "Low" },
            { value: "medium", label: "Medium" },
            { value: "high", label: "High" },
          ]}
          {...register("priority")}
        />
        <Input
          label="Assigned Agent ID"
          placeholder="Agent UUID"
          {...register("assigned_agent_id", { required: "Required" })}
          error={errors.assigned_agent_id?.message}
        />
        {create.error && (
          <p className="text-sm text-rose-600 font-body">{(create.error as Error).message}</p>
        )}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="flex-1" isLoading={create.isPending}>Open Deal</Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DealsPage() {
  usePipelineRealtime();
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState<DealStage | "">("");
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useDeals({ stage: filterStage || undefined, limit: 100 } as any);
  const advanceStage = useAdvanceStage("");

  const deals = data?.data ?? [];
  const pipelineValue = (data?.meta as any)?.pipeline_value ?? 0;

  const filtered = search
    ? deals.filter(d =>
        (d as any).property?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : deals;

  const byStage = (stage: DealStage) => filtered.filter(d => d.stage === stage);

  async function handleStageChange(deal: Deal, stage: DealStage) {
    const mutation = useAdvanceStage(deal.id);
    // Note: in real usage this would be called from a properly initialized mutation
    // This is simplified for the kanban interaction
    await fetch(`/api/deals/${deal.id}/stage`, {
      method: "PATCH",
      body: JSON.stringify({ stage }),
    });
  }

  function handleAdvance(deal: Deal, stage: DealStage) {
    // Fire and forget — optimistic via realtime
    fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/deals/${deal.id}/stage`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      }
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-stone-900">Pipeline</h1>
          <p className="text-stone-500 text-sm font-body mt-0.5">
            {deals.length} active deals · {formatCurrency(pipelineValue)} total value
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" /> Open Deal
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <Input
          placeholder="Search properties…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          icon={<Search className="w-4 h-4" />}
          className="w-72"
        />
        <Select
          placeholder="All stages"
          options={Object.entries(STAGE_CONFIG).map(([v, c]) => ({ value: v, label: c.label }))}
          value={filterStage}
          onChange={e => setFilterStage(e.target.value as DealStage | "")}
          className="w-44"
        />
      </div>

      {/* Kanban board */}
      <div className="flex gap-5 overflow-x-auto pb-4 flex-1">
        {ACTIVE_STAGES.map(stage => (
          <StageColumn
            key={stage}
            stage={stage}
            deals={byStage(stage)}
            onStageChange={handleAdvance}
            isLoading={isLoading}
          />
        ))}
      </div>

      <CreateDealModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
