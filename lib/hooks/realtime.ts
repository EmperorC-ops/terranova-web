"use client";
// lib/hooks/realtime.ts — subscribe to Supabase realtime channels, invalidate queries

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { QK } from "./queries";

/** Subscribe to the global pipeline channel — updates deal list on any stage change */
export function usePipelineRealtime() {
  const qc = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel("deals:pipeline")
      .on("broadcast", { event: "deal:stage_changed" }, () => {
        qc.invalidateQueries({ queryKey: ["deals"] });
      })
      .on("broadcast", { event: "deal:created" }, () => {
        qc.invalidateQueries({ queryKey: ["deals"] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);
}

/** Subscribe to a specific deal room */
export function useDealRealtime(dealId: string) {
  const qc = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    if (!dealId) return;

    const channel = supabase
      .channel(`deals:${dealId}`)
      .on("broadcast", { event: "activity:added" }, () => {
        qc.invalidateQueries({ queryKey: QK.dealActivity(dealId) });
      })
      .on("broadcast", { event: "participant:added" }, () => {
        qc.invalidateQueries({ queryKey: QK.dealParticipants(dealId) });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [dealId]);
}

/** Subscribe to document updates for a property */
export function useDocumentsRealtime(propertyId: string) {
  const qc = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    if (!propertyId) return;

    const channel = supabase
      .channel(`documents:${propertyId}`)
      .on("broadcast", { event: "document:uploaded" }, () => {
        qc.invalidateQueries({ queryKey: ["documents"] });
      })
      .on("broadcast", { event: "document:status_changed" }, () => {
        qc.invalidateQueries({ queryKey: ["documents"] });
        qc.invalidateQueries({ queryKey: ["approvals"] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [propertyId]);
}

/** Subscribe to a specific approval request */
export function useApprovalRealtime(requestId: string) {
  const qc = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    if (!requestId) return;

    const channel = supabase
      .channel(`approvals:${requestId}`)
      .on("broadcast", { event: "step:decided" }, () => {
        qc.invalidateQueries({ queryKey: QK.approval(requestId) });
      })
      .on("broadcast", { event: "request:resolved" }, () => {
        qc.invalidateQueries({ queryKey: QK.approval(requestId) });
        qc.invalidateQueries({ queryKey: ["approvals"] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [requestId]);
}

/** Subscribe to personal notifications */
export function useNotificationsRealtime(userId: string) {
  const qc = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on("broadcast", { event: "notification:created" }, () => {
        qc.invalidateQueries({ queryKey: ["notifications"] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);
}
