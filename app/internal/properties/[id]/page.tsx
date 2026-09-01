"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Building2, MapPin, Layers, FileText,
  ClipboardCheck, Handshake, Activity, Edit2, CheckCircle,
} from "lucide-react";
import { useProperty, usePropertyTimeline, useUpdateProperty } from "@/lib/hooks/queries";
import { useDocumentsRealtime } from "@/lib/hooks/realtime";
import {
  Card, Button, Badge, Skeleton, EmptyState, Modal, Select, Input,
} from "@/components/ui";
import {
  cn, formatCurrency, formatDate, formatRelative,
  STAGE_CONFIG, DOC_STATUS_CONFIG, SURVEY_STATUS_CONFIG,
} from "@/lib/utils";
import type { PropertyStatus } from "@/lib/types";

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { id: "overview",   label: "Overview",   icon: Building2    },
  { id: "deals",      label: "Deals",      icon: Handshake    },
  { id: "documents",  label: "Documents",  icon: FileText     },
  { id: "surveys",    label: "Surveys",    icon: ClipboardCheck },
  { id: "timeline",   label: "Timeline",   icon: Activity     },
] as const;

type Tab = (typeof TABS)[number]["id"];

// ─── Overview tab ─────────────────────────────────────────────────────────────

function OverviewTab({ property }: { property: any }) {
  const details = [
    { label: "Type",        value: property.type },
    { label: "Zoning",      value: property.zoning_code },
    { label: "Parcel ID",   value: property.parcel_id },
    { label: "Area",        value: property.area_sqft ? `${property.area_sqft.toLocaleString()} sq ft` : null },
    { label: "Coordinates", value: property.lat && property.lng ? `${property.lat.toFixed(4)}, ${property.lng.toFixed(4)}` : null },
    { label: "Added",       value: formatDate(property.created_at) },
  ].filter(d => d.value);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <Card className="p-6 lg:col-span-2">
        <h2 className="font-display text-xl text-stone-900 mb-4">Details</h2>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
          {details.map(d => (
            <div key={d.label}>
              <dt className="text-xs font-medium uppercase tracking-wider text-stone-500 font-body mb-0.5">{d.label}</dt>
              <dd className="text-sm text-stone-800 font-body capitalize">{d.value}</dd>
            </div>
          ))}
        </dl>
        {property.description && (
          <div className="mt-6 pt-6 border-t border-stone-100">
            <p className="text-xs font-medium uppercase tracking-wider text-stone-500 font-body mb-2">Description</p>
            <p className="text-sm text-stone-700 font-body leading-relaxed">{property.description}</p>
          </div>
        )}
      </Card>

      <div className="space-y-5">
        {/* Site score */}
        {property.site_score !== null && (
          <Card className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-stone-500 font-body mb-3">Site Score</p>
            <div className="flex items-end gap-3 mb-3">
              <span className="font-display text-5xl text-stone-900">{property.site_score}</span>
              <span className="text-stone-400 font-body text-sm mb-2">/100</span>
            </div>
            <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  property.site_score >= 80 ? "bg-forest-500" :
                  property.site_score >= 60 ? "bg-brass-500" : "bg-rose-500"
                )}
                style={{ width: `${property.site_score}%` }}
              />
            </div>
            <p className="text-xs text-stone-500 font-body mt-2">
              {property.site_score >= 80 ? "Excellent site" : property.site_score >= 60 ? "Good site" : "Needs attention"}
            </p>
          </Card>
        )}

        {/* Quick stats */}
        <Card className="p-5">
          <div className="space-y-4">
            {[
              { label: "Active Deals",      value: property.deals?.length ?? 0 },
              { label: "Documents",         value: property.documents?.length ?? 0 },
              { label: "Surveys",           value: property.surveys?.length ?? 0 },
              { label: "Open Approvals",    value: property.open_approvals ?? 0 },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-sm text-stone-600 font-body">{s.label}</span>
                <span className="text-sm font-bold text-stone-900 font-body">{s.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Deals tab ────────────────────────────────────────────────────────────────

function DealsTab({ deals }: { deals: any[] }) {
  if (!deals?.length) return (
    <EmptyState icon={<Handshake className="w-10 h-10" />} title="No deals" description="No deals have been opened for this property yet." />
  );

  return (
    <div className="space-y-3">
      {deals.map((deal: any) => {
        const cfg = STAGE_CONFIG[deal.stage as keyof typeof STAGE_CONFIG];
        return (
          <Link key={deal.id} href={`/internal/deals/${deal.id}`}>
            <Card hover className="flex items-center gap-4 p-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <Badge color={cfg?.color} bg={cfg?.bg}>{cfg?.label}</Badge>
                  <span className="text-xs text-stone-500 font-body capitalize">{deal.deal_type} · {deal.priority} priority</span>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <span className="font-display text-xl text-forest-700">{formatCurrency(deal.value, deal.currency)}</span>
                  {deal.assigned_agent && (
                    <span className="text-xs text-stone-500 font-body">Agent: {deal.assigned_agent.full_name}</span>
                  )}
                </div>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

// ─── Documents tab ────────────────────────────────────────────────────────────

function DocumentsTab({ documents }: { documents: any[] }) {
  if (!documents?.length) return (
    <EmptyState icon={<FileText className="w-10 h-10" />} title="No documents" description="No documents have been uploaded for this property." />
  );

  return (
    <Card>
      <div className="divide-y divide-stone-100">
        {documents.map((doc: any) => {
          const cfg = DOC_STATUS_CONFIG[doc.status as keyof typeof DOC_STATUS_CONFIG];
          return (
            <div key={doc.id} className="flex items-center gap-4 p-4">
              <FileText className="w-5 h-5 text-stone-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-900 font-body">{doc.name}</p>
                <p className="text-xs text-stone-500 font-body capitalize">{doc.type.replace("_", " ")} · {formatDate(doc.uploaded_at)}</p>
              </div>
              <Badge color={cfg?.color} bg={cfg?.bg}>{cfg?.label}</Badge>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Surveys tab ──────────────────────────────────────────────────────────────

function SurveysTab({ surveys }: { surveys: any[] }) {
  if (!surveys?.length) return (
    <EmptyState icon={<ClipboardCheck className="w-10 h-10" />} title="No surveys" description="No surveys have been scheduled for this property." />
  );

  return (
    <div className="space-y-3">
      {surveys.map((s: any) => {
        const cfg = SURVEY_STATUS_CONFIG[s.status as keyof typeof SURVEY_STATUS_CONFIG];
        return (
          <Link key={s.id} href={`/internal/surveys/${s.id}`}>
            <Card hover className="flex items-center gap-4 p-4">
              <ClipboardCheck className="w-5 h-5 text-stone-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-stone-900 font-body capitalize">{s.type.replace("_", " ")} Survey</p>
                <p className="text-xs text-stone-500 font-body">{formatDate(s.scheduled_date)}</p>
              </div>
              <div className="flex items-center gap-3">
                {s.score !== null && (
                  <span className="text-xs font-mono bg-stone-100 text-stone-600 px-2 py-0.5 rounded">{s.score}/100</span>
                )}
                <Badge color={cfg?.color} bg={cfg?.bg}>{cfg?.label}</Badge>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

// ─── Timeline tab ─────────────────────────────────────────────────────────────

function TimelineTab({ propertyId }: { propertyId: string }) {
  const { data, isLoading } = usePropertyTimeline(propertyId);
  const events = data?.events ?? [];

  const ICONS: Record<string, React.ReactNode> = {
    "activity:stage_change":   <Handshake   className="w-3.5 h-3.5" />,
    "activity:note":           <FileText    className="w-3.5 h-3.5" />,
    "document:uploaded":       <FileText    className="w-3.5 h-3.5" />,
    "survey:completed":        <CheckCircle className="w-3.5 h-3.5" />,
    "approval:approved":       <CheckCircle className="w-3.5 h-3.5" />,
  };

  if (isLoading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-16" />)}</div>;

  return (
    <div className="relative pl-7 max-w-2xl">
      <div className="absolute left-[10px] top-2 bottom-0 w-0.5 bg-stone-200" />
      {events.map((e: any, i) => (
        <div key={i} className="relative mb-5">
          <div className="absolute -left-7 top-0.5 w-5 h-5 rounded-full bg-white border-2 border-stone-300 flex items-center justify-center text-stone-500">
            {ICONS[e.type] ?? <Activity className="w-3 h-3" />}
          </div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-medium text-stone-700 font-body capitalize">{e.type.replace(":", ": ").replace("_", " ")}</span>
            <span className="text-2xs text-stone-400 font-body">{formatRelative(e.timestamp)}</span>
          </div>
          <p className="text-sm text-stone-600 font-body">
            {typeof e.payload === "object" ? (e.payload as any)?.body ?? JSON.stringify(e.payload) : String(e.payload)}
          </p>
        </div>
      ))}
      {events.length === 0 && <EmptyState title="No events yet" icon={<Activity className="w-8 h-8" />} />}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: property, isLoading } = useProperty(id);
  const updateProperty = useUpdateProperty(id);
  const [tab, setTab] = useState<Tab>("overview");
  const [editStatusOpen, setEditStatusOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<PropertyStatus>("available");

  useDocumentsRealtime(id);

  async function saveStatus() {
    await updateProperty.mutateAsync({ status: newStatus });
    setEditStatusOpen(false);
  }

  if (isLoading) return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-32" />
      <Skeleton className="h-64" />
    </div>
  );

  if (!property) return (
    <EmptyState title="Property not found" description="This property doesn't exist or you don't have access." />
  );

  const STATUS_CONFIG = {
    available:   { label: "Available",   color: "text-forest-700", bg: "bg-forest-50" },
    under_offer: { label: "Under Offer", color: "text-brass-700",  bg: "bg-brass-50"  },
    sold:        { label: "Sold",        color: "text-stone-600",  bg: "bg-stone-100" },
    off_market:  { label: "Off Market",  color: "text-rose-700",   bg: "bg-rose-50"   },
  };

  const statusCfg = STATUS_CONFIG[property.status as keyof typeof STATUS_CONFIG];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Back */}
      <Link href="/internal/properties" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 font-body transition-colors">
        <ArrowLeft className="w-4 h-4" /> Properties
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-display text-3xl text-stone-900">{property.name}</h1>
            <Badge color={statusCfg.color} bg={statusCfg.bg}>{statusCfg.label}</Badge>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-stone-500 font-body">
            <MapPin className="w-4 h-4" />
            <span>{property.address}</span>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setNewStatus(property.status as PropertyStatus); setEditStatusOpen(true); }}>
          <Edit2 className="w-3.5 h-3.5" /> Update Status
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-stone-200 -mb-4">
        {TABS.map(({ id: tabId, label, icon: Icon }) => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium font-body border-b-2 transition-all -mb-px",
              tab === tabId
                ? "border-forest-600 text-forest-700"
                : "border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="pt-2">
        {tab === "overview"  && <OverviewTab property={property} />}
        {tab === "deals"     && <DealsTab deals={(property as any).deals} />}
        {tab === "documents" && <DocumentsTab documents={(property as any).documents} />}
        {tab === "surveys"   && <SurveysTab surveys={(property as any).surveys} />}
        {tab === "timeline"  && <TimelineTab propertyId={id} />}
      </div>

      {/* Edit status modal */}
      <Modal open={editStatusOpen} onClose={() => setEditStatusOpen(false)} title="Update Property Status">
        <div className="flex flex-col gap-4">
          <Select
            label="New status"
            value={newStatus}
            options={[
              { value: "available",   label: "Available"   },
              { value: "under_offer", label: "Under Offer" },
              { value: "sold",        label: "Sold"        },
              { value: "off_market",  label: "Off Market"  },
            ]}
            onChange={e => setNewStatus(e.target.value as PropertyStatus)}
          />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setEditStatusOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={saveStatus} isLoading={updateProperty.isPending}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
