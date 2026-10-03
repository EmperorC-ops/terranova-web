"use client";
// components/deals/DealFlowPanel.tsx
// Nigerian deal-flow panel: shows the live state-machine position for a deal and
// renders the currently-legal events as buttons. Reads from GET /transitions/:id,
// acts via POST /transitions. A refused move (409) shows its reason inline.

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { transitionsApi, ApiError } from "@/lib/api/client";
import { Card, Button, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

const EVENT_LABEL: Record<string, string> = {
  VERIFY_TITLE: "Verify title", REJECT_TITLE: "Reject · bad title", ISSUE_OFFER: "Issue offer",
  BEGIN_DUE_DILIGENCE: "Begin due diligence", DD_PASS: "Due diligence passed", DD_FAIL: "Due diligence failed",
  ENTER_TRACKS: "Start mortgage tracks", SEARCH_DONE: "Search done", CHARTING_DONE: "Charting done",
  VALUATION_DONE: "Valuation done", PROPERTY_FAIL: "Property failed", CREDIT_APPROVE: "Approve credit",
  CREDIT_DECLINE: "Decline credit", REACH_GATE: "Pass the gate", SIGN_DEEDS: "Sign deeds",
  ASSIGN_INSURANCE: "Assign insurance", DISBURSE: "Disburse funds", BEGIN_PERFECTION: "Begin perfection",
  OBTAIN_CONSENT: "Obtain consent", STAMP: "Stamp", REGISTER: "Register", CLOSE: "Close deal",
  PAY_COMMISSION: "Pay commission",
};
const DESTRUCTIVE = new Set(["REJECT_TITLE", "DD_FAIL", "PROPERTY_FAIL", "CREDIT_DECLINE"]);

const STATE_LABEL: Record<string, string> = {
  Draft: "Draft", TitleVerified: "Title verified", OfferIssued: "Offer issued",
  DueDiligence: "Due diligence", Cleared: "Cleared", InTracks: "Mortgage tracks running",
  Approved: "Approved (gate passed)", DeedsExecuted: "Deeds executed", Perfecting: "Perfecting title",
  Perfected: "Perfected", Closed: "Closed", CommissionPaid: "Commission paid", Rejected: "Rejected",
};

const PERFECTION_STEPS = ["ConsentPending", "ConsentObtained", "Stamped", "Perfected"];
const PERFECTION_LABEL: Record<string, string> = {
  ConsentPending: "Consent", ConsentObtained: "Consent ✓", Stamped: "Stamped", Perfected: "Registered",
};
const SOCKET_LABEL: Record<string, string> = {
  verification_fee: "Verification fee", bank_referral: "Bank referral", insurer_referral: "Insurer referral",
  perfection_concierge: "Perfection concierge", success_fee: "Success fee", commission_spread: "Commission spread",
};

function Pill({ children, tone = "stone" }: { children: React.ReactNode; tone?: "stone" | "forest" | "brass" | "green" }) {
  const map = {
    stone: "bg-stone-100 text-stone-600 border-stone-200",
    forest: "bg-forest-50 text-forest-700 border-forest-200",
    brass: "bg-brass-50 text-brass-700 border-brass-200",
    green: "bg-forest-500 text-white border-forest-500",
  };
  return <span className={cn("inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-mono", map[tone])}>{children}</span>;
}

export function DealFlowPanel({ dealId }: { dealId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["deals", dealId, "flow"],
    queryFn: () => transitionsApi.getFlow(dealId),
    enabled: !!dealId,
  });
  const [error, setError] = useState<string | null>(null);
  const fire = useMutation({
    mutationFn: (event: string) => transitionsApi.fire(dealId, event),
    onMutate: () => setError(null),
    onError: (e) => setError(e instanceof ApiError ? e.message : "Something went wrong"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deals", dealId, "flow"] });
      qc.invalidateQueries({ queryKey: ["deals", dealId] });
    },
  });

  if (isLoading) return <Card className="p-5"><p className="text-sm text-stone-400 font-body">Loading deal flow…</p></Card>;
  if (!data) return null;

  const { deal, available } = data;
  const isMortgage = deal.path === "mortgage";
  const perfectionActive = deal.perfection && deal.perfection !== "NotStarted";
  const sockets = deal.moneyEvents ?? [];

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-medium uppercase tracking-wider text-stone-500 font-body">Deal flow · Nigeria</p>
        <Badge color="#8a6d1f" bg="#faf3e0">{isMortgage ? "Mortgage" : "Cash"}</Badge>
      </div>

      {/* Current state */}
      <div className="mb-4">
        <p className="font-display text-2xl text-forest-700">{STATE_LABEL[deal.state] ?? deal.state}</p>
        <p className="text-2xs font-mono text-stone-400 mt-0.5">{deal.state}</p>
      </div>

      {/* Mortgage tracks */}
      {isMortgage && (deal.tracks.property || deal.tracks.buyer) && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl border border-stone-200 p-3">
            <p className="text-2xs uppercase tracking-wide text-stone-400 font-body mb-1">Track A · property</p>
            <Pill tone="forest">{deal.tracks.property ?? "-"}</Pill>
          </div>
          <div className="rounded-xl border border-stone-200 p-3">
            <p className="text-2xs uppercase tracking-wide text-stone-400 font-body mb-1">Track B · buyer</p>
            <Pill tone="brass">{deal.tracks.buyer ?? "-"}</Pill>
          </div>
        </div>
      )}

      {/* Perfection progress */}
      {perfectionActive && (
        <div className="mb-4">
          <p className="text-2xs uppercase tracking-wide text-stone-400 font-body mb-2">Perfection (locked order)</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {PERFECTION_STEPS.map((step, i) => {
              const reached = PERFECTION_STEPS.indexOf(deal.perfection) >= i;
              return <Pill key={step} tone={reached ? "green" : "stone"}>{PERFECTION_LABEL[step]}</Pill>;
            })}
          </div>
        </div>
      )}

      {/* Money sockets marked */}
      {sockets.length > 0 && (
        <div className="mb-4">
          <p className="text-2xs uppercase tracking-wide text-stone-400 font-body mb-2">Revenue points reached</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {sockets.map((m) => <Pill key={m.socket} tone="brass">{SOCKET_LABEL[m.socket] ?? m.socket}</Pill>)}
          </div>
        </div>
      )}

      {/* Error from a refused move */}
      {error && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 font-body">{error}</div>
      )}

      {/* Available actions */}
      <div>
        <p className="text-2xs uppercase tracking-wide text-stone-400 font-body mb-2">Next actions</p>
        {available.length === 0 ? (
          <p className="text-sm text-stone-400 font-body">No further actions. This deal has reached a terminal state.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {available.map((ev) => (
              <Button
                key={ev}
                size="sm"
                variant={DESTRUCTIVE.has(ev) ? "secondary" : "primary"}
                isLoading={fire.isPending && fire.variables === ev}
                onClick={() => fire.mutate(ev)}
                className={cn(DESTRUCTIVE.has(ev) && "text-red-600 border-red-200 hover:bg-red-50")}
              >
                {EVENT_LABEL[ev] ?? ev}
              </Button>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
