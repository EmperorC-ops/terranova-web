"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Calendar } from "lucide-react";
import { useDeals, useCreateDeal } from "@/lib/hooks/queries";
import { usePipelineRealtime } from "@/lib/hooks/realtime";
import {
  Button, Input, Select, Card, Skeleton, Modal,
} from "@/components/ui";
import {
  cn, formatCurrency, formatDate,
  DEAL_STATUS, dealStatus,
} from "@/lib/utils";
import type { Deal } from "@/lib/types";
import { useForm } from "react-hook-form";

// ─── Deal card ────────────────────────────────────────────────────────────────

function DealCard({ deal }: { deal: Deal }) {
  const st = dealStatus((deal as any).sm_state);
  return (
    <Link href={`/internal/deals/${deal.id}`} className="block kanban-card bg-white rounded-xl border border-stone-200 p-4 shadow-card cursor-pointer group">
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-sm font-semibold text-stone-900 font-body leading-snug group-hover:text-forest-700 transition-colors">
          {(deal as any).property?.name ?? "Untitled property"}
        </h3>
        <span className={cn(
          "text-2xs font-bold px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0",
          deal.priority === "high" ? "bg-rose-100 text-rose-700" :
          deal.priority === "medium" ? "bg-brass-100 text-brass-700" : "bg-stone-100 text-stone-600"
        )}>{deal.priority}</span>
      </div>
      <p className="font-display text-lg text-forest-700">{formatCurrency(deal.value, deal.currency)}</p>
      <div className="flex items-center gap-2 mt-2">
        <span className={cn("text-2xs font-semibold px-1.5 py-0.5 rounded-full", st.color, st.bg)}>{st.label}</span>
        {(deal as any).path && (
          <span className="text-2xs text-stone-400 font-body capitalize">{(deal as any).path}</span>
        )}
      </div>
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
  );
}

// ─── Status column ────────────────────────────────────────────────────────────

function StatusColumn({ bucket, deals, isLoading }: {
  bucket: (typeof DEAL_STATUS)[number];
  deals: Deal[];
  isLoading: boolean;
}) {
  const totalValue = deals.reduce((a, d) => a + Number(d.value ?? 0), 0);
  return (
    <div className="flex flex-col min-w-[260px] max-w-[300px]">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", bucket.dot)} />
          <span className={cn("text-xs font-semibold uppercase tracking-wider font-body", bucket.color)}>
            {bucket.label}
          </span>
          <span className="bg-stone-100 text-stone-600 text-xs font-bold px-1.5 py-0.5 rounded font-body">
            {deals.length}
          </span>
        </div>
        <span className="text-xs text-stone-400 font-body">{formatCurrency(totalValue)}</span>
      </div>
      <div className="flex flex-col gap-3 flex-1">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-32" />)
        ) : deals.length === 0 ? (
          <div className="border-2 border-dashed border-stone-200 rounded-xl h-24 flex items-center justify-center text-xs text-stone-400 font-body">
            No deals
          </div>
        ) : (
          deals.map(d => <DealCard key={d.id} deal={d} />)
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
        <Input label="Property ID" placeholder="Property UUID" hint="Paste the property ID from the Properties page"
          {...register("property_id", { required: "Required" })} error={errors.property_id?.message} />
        <Input label="Deal Value (USD)" type="number" placeholder="2500000"
          {...register("value", { required: "Required", min: { value: 1, message: "Must be > 0" } })} error={errors.value?.message} />
        <Select label="Deal Type" options={[
          { value: "sale", label: "Sale" }, { value: "lease", label: "Lease" }, { value: "acquisition", label: "Acquisition" },
        ]} {...register("deal_type")} />
        <Select label="Priority" options={[
          { value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" },
        ]} {...register("priority")} />
        <Input label="Assigned Agent ID" placeholder="Agent UUID"
          {...register("assigned_agent_id", { required: "Required" })} error={errors.assigned_agent_id?.message} />
        {create.error && <p className="text-sm text-rose-600 font-body">{(create.error as Error).message}</p>}
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
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useDeals({ limit: 100 } as any);
  const deals = data?.data ?? [];
  const pipelineValue = (data?.meta as any)?.pipeline_value ?? deals.reduce((a, d) => a + Number(d.value ?? 0), 0);

  const filtered = deals.filter(d => {
    if (search && !(d as any).property?.name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus && dealStatus((d as any).sm_state).key !== filterStatus) return false;
    return true;
  });

  const inBucket = (key: string) => filtered.filter(d => dealStatus((d as any).sm_state).key === key);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-stone-900">Pipeline</h1>
          <p className="text-stone-500 text-sm font-body mt-0.5">
            {deals.length} deals · {formatCurrency(pipelineValue)} total value · tracked by the deal engine
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" /> Open Deal
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <Input placeholder="Search properties..." value={search} onChange={e => setSearch(e.target.value)}
          icon={<Search className="w-4 h-4" />} className="w-72" />
        <Select placeholder="All statuses"
          options={DEAL_STATUS.map(b => ({ value: b.key, label: b.label }))}
          value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-44" />
      </div>

      <div className="flex gap-5 overflow-x-auto pb-4 flex-1">
        {DEAL_STATUS.map(bucket => (
          <StatusColumn key={bucket.key} bucket={bucket} deals={inBucket(bucket.key)} isLoading={isLoading} />
        ))}
      </div>

      <CreateDealModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
