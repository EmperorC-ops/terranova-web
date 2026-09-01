import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import type { DealStage, DocStatus, SurveyStatus, ApprovalStatus } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Formatting ───────────────────────────────────────────────────────────────

export function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency, maximumFractionDigits: 0,
    notation: value >= 1_000_000 ? "compact" : "standard",
  }).format(value);
}

export function formatDate(date: string | Date, fmt = "d MMM yyyy") {
  return format(new Date(date), fmt);
}

export function formatRelative(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Stage / Status colors ────────────────────────────────────────────────────

export const STAGE_CONFIG: Record<DealStage, { label: string; color: string; bg: string; border: string }> = {
  lead:          { label: "Lead",          color: "text-stone-600",  bg: "bg-stone-100",   border: "border-stone-300" },
  site_visit:    { label: "Site Visit",    color: "text-brass-700",  bg: "bg-brass-50",    border: "border-brass-200" },
  negotiation:   { label: "Negotiation",   color: "text-amber-700",  bg: "bg-amber-50",    border: "border-amber-200" },
  due_diligence: { label: "Due Diligence", color: "text-blue-700",   bg: "bg-blue-50",     border: "border-blue-200"  },
  closed:        { label: "Closed",        color: "text-forest-700", bg: "bg-forest-50",   border: "border-forest-200"},
  lost:          { label: "Lost",          color: "text-rose-700",   bg: "bg-rose-50",     border: "border-rose-200"  },
};

export const DOC_STATUS_CONFIG: Record<DocStatus, { label: string; color: string; bg: string }> = {
  draft:          { label: "Draft",          color: "text-stone-600",  bg: "bg-stone-100" },
  pending_review: { label: "Pending Review", color: "text-amber-700",  bg: "bg-amber-50"  },
  approved:       { label: "Approved",       color: "text-forest-700", bg: "bg-forest-50" },
  rejected:       { label: "Rejected",       color: "text-rose-700",   bg: "bg-rose-50"   },
  signed:         { label: "Signed",         color: "text-blue-700",   bg: "bg-blue-50"   },
};

export const SURVEY_STATUS_CONFIG: Record<SurveyStatus, { label: string; color: string; bg: string }> = {
  scheduled:   { label: "Scheduled",   color: "text-brass-700",  bg: "bg-brass-50"  },
  in_progress: { label: "In Progress", color: "text-blue-700",   bg: "bg-blue-50"   },
  completed:   { label: "Completed",   color: "text-forest-700", bg: "bg-forest-50" },
  cancelled:   { label: "Cancelled",   color: "text-stone-500",  bg: "bg-stone-100" },
};

export const APPROVAL_STATUS_CONFIG: Record<ApprovalStatus, { label: string; color: string; bg: string }> = {
  pending:     { label: "Pending",     color: "text-stone-600",  bg: "bg-stone-100" },
  in_progress: { label: "In Progress", color: "text-blue-700",   bg: "bg-blue-50"   },
  approved:    { label: "Approved",    color: "text-forest-700", bg: "bg-forest-50" },
  rejected:    { label: "Rejected",    color: "text-rose-700",   bg: "bg-rose-50"   },
  cancelled:   { label: "Cancelled",   color: "text-stone-500",  bg: "bg-stone-100" },
};

// ─── Misc ─────────────────────────────────────────────────────────────────────

export function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export const DEAL_STAGES: DealStage[] = [
  "lead", "site_visit", "negotiation", "due_diligence", "closed", "lost",
];

export const ACTIVE_STAGES: DealStage[] = [
  "lead", "site_visit", "negotiation", "due_diligence",
];
