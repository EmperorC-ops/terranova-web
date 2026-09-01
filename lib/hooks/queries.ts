"use client";
// lib/hooks/queries.ts — React Query hooks for every data domain

import { useQuery, useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import {
  propertiesApi, dealsApi, documentsApi, surveysApi,
  approvalsApi, notificationsApi,
} from "@/lib/api/client";
import type {
  ListPropertiesQuery, ListDealsQuery,
  CreatePropertyRequest, UpdatePropertyRequest,
  CreateDealRequest, UpdateDealStageRequest, AddParticipantRequest,
  GrantAccessRequest, UpdateDocStatusRequest, CreateSurveyRequest,
  CompleteSurveyRequest, CreateApprovalRequest, DecideStepRequest,
} from "@/lib/types";

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const QK = {
  properties:       (q?: ListPropertiesQuery) => ["properties", q] as const,
  property:         (id: string)              => ["properties", id] as const,
  propertyTimeline: (id: string)              => ["properties", id, "timeline"] as const,
  deals:            (q?: ListDealsQuery)       => ["deals", q] as const,
  deal:             (id: string)              => ["deals", id] as const,
  dealParticipants: (id: string)              => ["deals", id, "participants"] as const,
  dealActivity:     (id: string)              => ["deals", id, "activity"] as const,
  documents:        (q?: Record<string,string>)=> ["documents", q] as const,
  documentVersions: (id: string)              => ["documents", id, "versions"] as const,
  surveys:          (q?: Record<string,string>)=> ["surveys", q] as const,
  survey:           (id: string)              => ["surveys", id] as const,
  approvals:        (q?: Record<string,string>)=> ["approvals", q] as const,
  approval:         (id: string)              => ["approvals", id] as const,
  workflows:        ()                        => ["workflows"] as const,
  notifications:    (unreadOnly?: boolean)    => ["notifications", unreadOnly] as const,
} as const;

// ─── Properties ───────────────────────────────────────────────────────────────

export function useProperties(query?: ListPropertiesQuery) {
  return useQuery({ queryKey: QK.properties(query), queryFn: () => propertiesApi.list(query) });
}

export function useProperty(id: string) {
  return useQuery({ queryKey: QK.property(id), queryFn: () => propertiesApi.get(id), enabled: !!id });
}

export function usePropertyTimeline(id: string) {
  return useQuery({ queryKey: QK.propertyTimeline(id), queryFn: () => propertiesApi.timeline(id), enabled: !!id });
}

export function useCreateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePropertyRequest) => propertiesApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["properties"] }),
  });
}

export function useUpdateProperty(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdatePropertyRequest) => propertiesApi.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.property(id) });
      qc.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}

// ─── Deals ────────────────────────────────────────────────────────────────────

export function useDeals(query?: ListDealsQuery) {
  return useQuery({ queryKey: QK.deals(query), queryFn: () => dealsApi.list(query) });
}

export function useDeal(id: string) {
  return useQuery({ queryKey: QK.deal(id), queryFn: () => dealsApi.get(id), enabled: !!id });
}

export function useDealParticipants(id: string) {
  return useQuery({ queryKey: QK.dealParticipants(id), queryFn: () => dealsApi.participants(id), enabled: !!id });
}

export function useDealActivity(id: string) {
  return useQuery({ queryKey: QK.dealActivity(id), queryFn: () => dealsApi.activity(id), enabled: !!id });
}

export function useCreateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateDealRequest) => dealsApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deals"] }),
  });
}

export function useAdvanceStage(dealId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateDealStageRequest) => dealsApi.advanceStage(dealId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.deal(dealId) });
      qc.invalidateQueries({ queryKey: ["deals"] });
    },
  });
}

export function useAddParticipant(dealId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AddParticipantRequest) => dealsApi.addParticipant(dealId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.dealParticipants(dealId) }),
  });
}

export function useAddActivity(dealId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { type: string; payload?: Record<string, unknown> }) =>
      dealsApi.addActivity(dealId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.dealActivity(dealId) }),
  });
}

// ─── Documents ────────────────────────────────────────────────────────────────

export function useDocuments(query?: Record<string, string>) {
  return useQuery({ queryKey: QK.documents(query), queryFn: () => documentsApi.list(query) });
}

export function useDocumentVersions(id: string) {
  return useQuery({ queryKey: QK.documentVersions(id), queryFn: () => documentsApi.versions(id), enabled: !!id });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => documentsApi.upload(formData),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });
}

export function useGrantAccess(docId: string) {
  return useMutation({
    mutationFn: (body: GrantAccessRequest) => documentsApi.grantAccess(docId, body),
  });
}

export function useUpdateDocStatus(docId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateDocStatusRequest) => documentsApi.updateStatus(docId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });
}

// ─── Surveys ─────────────────────────────────────────────────────────────────

export function useSurveys(query?: Record<string, string>) {
  return useQuery({ queryKey: QK.surveys(query), queryFn: () => surveysApi.list(query) });
}

export function useSurvey(id: string) {
  return useQuery({ queryKey: QK.survey(id), queryFn: () => surveysApi.get(id), enabled: !!id });
}

export function useCreateSurvey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateSurveyRequest) => surveysApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["surveys"] }),
  });
}

export function useCompleteSurvey(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CompleteSurveyRequest) => surveysApi.complete(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.survey(id) });
      qc.invalidateQueries({ queryKey: ["surveys"] });
    },
  });
}

// ─── Approvals ────────────────────────────────────────────────────────────────

export function useApprovals(query?: Record<string, string>) {
  return useQuery({ queryKey: QK.approvals(query), queryFn: () => approvalsApi.list(query) });
}

export function useApproval(id: string) {
  return useQuery({ queryKey: QK.approval(id), queryFn: () => approvalsApi.get(id), enabled: !!id });
}

export function useWorkflows() {
  return useQuery({ queryKey: QK.workflows(), queryFn: () => approvalsApi.workflows() });
}

export function useCreateApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateApprovalRequest) => approvalsApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["approvals"] }),
  });
}

export function useDecideStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, stepId, body }: { requestId: string; stepId: string; body: DecideStepRequest }) =>
      approvalsApi.decide(requestId, stepId, body),
    onSuccess: (_data, { requestId }) => {
      qc.invalidateQueries({ queryKey: QK.approval(requestId) });
      qc.invalidateQueries({ queryKey: ["approvals"] });
    },
  });
}

// ─── Notifications ────────────────────────────────────────────────────────────

export function useNotifications(unreadOnly?: boolean) {
  return useQuery({
    queryKey: QK.notifications(unreadOnly),
    queryFn: () => notificationsApi.list({ is_read: unreadOnly ? false : undefined }),
    refetchInterval: 30_000, // poll every 30s as fallback
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
