"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus, Search, MapPin, Building2, TrendingUp, Layers } from "lucide-react";
import { useProperties, useCreateProperty } from "@/lib/hooks/queries";
import {
  Card, Button, Input, Select, EmptyState, Badge, Skeleton, Modal,
  StatCard,
} from "@/components/ui";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { Property, PropertyType, PropertyStatus } from "@/lib/types";
import { useForm } from "react-hook-form";

// ─── Property card ────────────────────────────────────────────────────────────

function PropertyCard({ property }: { property: Property }) {
  const STATUS_CONFIG: Record<PropertyStatus, { label: string; color: string; bg: string }> = {
    available:   { label: "Available",    color: "text-forest-700", bg: "bg-forest-50"  },
    under_offer: { label: "Under Offer",  color: "text-brass-700",  bg: "bg-brass-50"   },
    sold:        { label: "Sold",         color: "text-stone-600",  bg: "bg-stone-100"  },
    off_market:  { label: "Off Market",   color: "text-rose-700",   bg: "bg-rose-50"    },
  };

  const TYPE_ICONS: Record<PropertyType, React.ReactNode> = {
    residential: <Building2 className="w-4 h-4" />,
    commercial:  <Layers    className="w-4 h-4" />,
    industrial:  <Layers    className="w-4 h-4" />,
    land:        <MapPin    className="w-4 h-4" />,
  };

  const cfg = STATUS_CONFIG[property.status];

  return (
    <Link href={`/internal/properties/${property.id}`}>
      <Card hover className="overflow-hidden">
        {/* Map placeholder — coloured by type */}
        <div className={cn(
          "h-36 flex items-center justify-center text-white relative overflow-hidden",
          property.type === "residential" ? "bg-gradient-to-br from-forest-700 to-forest-900" :
          property.type === "commercial"  ? "bg-gradient-to-br from-stone-700 to-stone-900" :
          property.type === "industrial"  ? "bg-gradient-to-br from-brass-700 to-stone-900" :
                                            "bg-gradient-to-br from-forest-800 to-stone-900"
        )}>
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "linear-gradient(0deg, transparent 24%, rgba(255,255,255,.05) 25%, rgba(255,255,255,.05) 26%, transparent 27%, transparent 74%, rgba(255,255,255,.05) 75%, rgba(255,255,255,.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255,255,255,.05) 25%, rgba(255,255,255,.05) 26%, transparent 27%, transparent 74%, rgba(255,255,255,.05) 75%, rgba(255,255,255,.05) 76%, transparent 77%, transparent)",
              backgroundSize: "30px 30px",
            }}
          />
          <div className="relative z-10 text-center">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-2">
              {TYPE_ICONS[property.type]}
            </div>
            {property.site_score !== null && (
              <div className="text-xs font-mono bg-white/20 px-2 py-0.5 rounded-full">
                Score: {property.site_score}/100
              </div>
            )}
          </div>
          <Badge
            color={cfg.color}
            bg={cfg.bg}
            className="absolute top-3 right-3 shadow-sm"
          >
            {cfg.label}
          </Badge>
        </div>

        <div className="p-4">
          <h3 className="font-display text-lg text-stone-900 leading-tight mb-1">{property.name}</h3>
          <div className="flex items-center gap-1 text-xs text-stone-500 font-body mb-3">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{property.address}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-stone-500 font-body">
            <span className="capitalize">{property.type}</span>
            {property.area_sqft && (
              <span>{property.area_sqft.toLocaleString()} sq ft</span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}

// ─── Create property modal ────────────────────────────────────────────────────

function CreatePropertyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateProperty();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<{
    name: string; type: PropertyType; address: string;
    area_sqft: string; zoning_code: string; description: string;
  }>();

  async function onSubmit(data: any) {
    await create.mutateAsync({
      name: data.name,
      type: data.type,
      address: data.address,
      area_sqft: data.area_sqft ? Number(data.area_sqft) : undefined,
      zoning_code: data.zoning_code || undefined,
      description: data.description || undefined,
    });
    reset();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Property" className="max-w-lg">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Property name"
          placeholder="Riverside Commercial Plaza"
          {...register("name", { required: "Name is required" })}
          error={errors.name?.message}
        />
        <Select
          label="Type"
          options={[
            { value: "residential", label: "Residential" },
            { value: "commercial",  label: "Commercial"  },
            { value: "industrial",  label: "Industrial"  },
            { value: "land",        label: "Land"        },
          ]}
          {...register("type", { required: true })}
        />
        <Input
          label="Address"
          placeholder="12 River St, New York, NY"
          {...register("address", { required: "Address is required" })}
          error={errors.address?.message}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Area (sq ft)"
            type="number"
            placeholder="12400"
            {...register("area_sqft")}
          />
          <Input
            label="Zoning code"
            placeholder="C-2"
            {...register("zoning_code")}
          />
        </div>
        <Input
          label="Description"
          placeholder="Brief notes about the property…"
          {...register("description")}
        />
        {create.error && (
          <p className="text-sm text-rose-600 font-body">{(create.error as Error).message}</p>
        )}
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="flex-1" isLoading={create.isPending}>Add Property</Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PropertiesPage() {
  const [search, setSearch]       = useState("");
  const [filterType, setFilterType]     = useState<PropertyType | "">("");
  const [filterStatus, setFilterStatus] = useState<PropertyStatus | "">("");
  const [createOpen, setCreateOpen]     = useState(false);

  const { data, isLoading } = useProperties({
    type:   filterType   || undefined,
    status: filterStatus || undefined,
  } as any);

  const properties = (data?.data ?? []).filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
               p.address.toLowerCase().includes(search.toLowerCase())
  );

  const byStatus = (s: PropertyStatus) => (data?.data ?? []).filter(p => p.status === s).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-stone-900">Properties</h1>
          <p className="text-stone-500 text-sm font-body mt-0.5">{data?.meta?.total ?? 0} properties in portfolio</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" /> Add Property
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Available",   value: byStatus("available"),   color: "forest" },
          { label: "Under Offer", value: byStatus("under_offer"), color: "brass"  },
          { label: "Sold",        value: byStatus("sold"),        color: "stone"  },
          { label: "Off Market",  value: byStatus("off_market"),  color: "stone"  },
        ].map(s => (
          <Card key={s.label} className="px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wider text-stone-500 font-body mb-1">{s.label}</p>
            <p className="font-display text-3xl text-stone-900">{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search properties…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          icon={<Search className="w-4 h-4" />}
          className="w-72"
        />
        <Select
          placeholder="All types"
          options={[
            { value: "residential", label: "Residential" },
            { value: "commercial",  label: "Commercial"  },
            { value: "industrial",  label: "Industrial"  },
            { value: "land",        label: "Land"        },
          ]}
          value={filterType}
          onChange={e => setFilterType(e.target.value as PropertyType | "")}
          className="w-44"
        />
        <Select
          placeholder="All statuses"
          options={[
            { value: "available",   label: "Available"    },
            { value: "under_offer", label: "Under Offer"  },
            { value: "sold",        label: "Sold"         },
            { value: "off_market",  label: "Off Market"   },
          ]}
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as PropertyStatus | "")}
          className="w-44"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-12 h-12" />}
          title="No properties found"
          description="Add your first property to start managing deals."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4" /> Add Property
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 stagger-children">
          {properties.map(p => <PropertyCard key={p.id} property={p} />)}
        </div>
      )}

      <CreatePropertyModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
