// lib/api/client.ts
// Typed fetch wrapper for all Edge Function endpoints.
// Reads the access token from the active Supabase session.

import { session } from "@/lib/auth/session";
import type {
  LoginRequest, LoginResponse, MeResponse,
  ListPropertiesResponse, ListPropertiesQuery,
  CreatePropertyRequest, UpdatePropertyRequest, PropertyWithDetails,
  ListDealsResponse, ListDealsQuery, CreateDealRequest,
  Deal, UpdateDealStageRequest, AddParticipantRequest,
  ListDocumentsQuery, UploadDocumentRequest, GrantAccessRequest,
  UpdateDocStatusRequest, DownloadUrlResponse,
  CreateSurveyRequest, CompleteSurveyRequest,
  CreateApprovalRequest, CreateWorkflowRequest, DecideStepRequest,
  ListNotificationsResponse,
  Property, DealParticipant, DealActivity,
  Document, Survey, ApprovalRequest, ApprovalWorkflow, Notification,
} from "@/lib/types";

const BASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL + "/functions/v1";

// ─── Core fetch helper ────────────────────────────────────────────────────────

async function getToken(): Promise<string | null> {
  return session.getAccessToken();
}

let refreshing: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const refresh = session.getRefreshToken();
    if (!refresh) return false;
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refresh }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      session.setAccessToken(data.access_token);
      if (data.refresh_token) session.setRefreshToken(data.refresh_token);
      return true;
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit & { params?: Record<string, string | number | boolean | undefined> } = {}
): Promise<T> {
  const { params, ...fetchOpts } = options;

  let url = `${BASE_URL}${path}`;
  if (params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) qs.set(k, String(v));
    });
    const str = qs.toString();
    if (str) url += `?${str}`;
  }

  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { ...fetchOpts, headers });

  // Expired token - refresh once and retry
  if (res.status === 401 && token) {
    const ok = await tryRefresh();
    if (ok) {
      headers["Authorization"] = `Bearer ${session.getAccessToken()}`;
      const retry = await fetch(url, { ...fetchOpts, headers });
      if (retry.ok) return retry.json() as Promise<T>;
    }
    session.clear();
    if (typeof window !== "undefined") window.location.href = "/auth/login";
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: "Unknown error" } }));
    throw new ApiError(err.error?.message ?? "Request failed", res.status, err.error?.code);
  }

  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  me: () => apiFetch<MeResponse>("/auth/me"),
  invite: (body: Parameters<typeof apiFetch>[1] extends { body?: infer B } ? B : never) =>
    apiFetch("/auth/invite", { method: "POST", body: JSON.stringify(body) }),
};

// ─── Properties ───────────────────────────────────────────────────────────────

export const propertiesApi = {
  list: (query?: ListPropertiesQuery) =>
    apiFetch<ListPropertiesResponse>("/properties", { params: query as Record<string, string> }),
  get: (id: string) => apiFetch<PropertyWithDetails>(`/properties/${id}`),
  create: (body: CreatePropertyRequest) =>
    apiFetch<Property>("/properties", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: UpdatePropertyRequest) =>
    apiFetch<Property>(`/properties/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  timeline: (id: string) => apiFetch<{ events: unknown[] }>(`/properties/${id}/timeline`),
};

// ─── Deals ────────────────────────────────────────────────────────────────────

export const dealsApi = {
  list: (query?: ListDealsQuery) =>
    apiFetch<ListDealsResponse>("/deals", { params: query as Record<string, string> }),
  get: (id: string) => apiFetch<Deal>(`/deals/${id}`),
  create: (body: CreateDealRequest) =>
    apiFetch<Deal>("/deals", { method: "POST", body: JSON.stringify(body) }),
  advanceStage: (id: string, body: UpdateDealStageRequest) =>
    apiFetch<Deal>(`/deals/${id}/stage`, { method: "PATCH", body: JSON.stringify(body) }),
  participants: (id: string) =>
    apiFetch<{ participants: DealParticipant[] }>(`/deals/${id}/participants`),
  addParticipant: (id: string, body: AddParticipantRequest) =>
    apiFetch<DealParticipant>(`/deals/${id}/participants`, { method: "POST", body: JSON.stringify(body) }),
  activity: (id: string) =>
    apiFetch<{ activities: DealActivity[] }>(`/deals/${id}/activity`),
  addActivity: (id: string, body: { type: string; payload?: Record<string, unknown> }) =>
    apiFetch<DealActivity>(`/deals/${id}/activity`, { method: "POST", body: JSON.stringify(body) }),
};

// ─── Documents ────────────────────────────────────────────────────────────────

export const documentsApi = {
  list: (query?: ListDocumentsQuery) =>
    apiFetch<{ data: Document[]; meta: unknown }>("/documents", { params: query as Record<string, string> }),
  upload: async (formData: FormData) => {
    const token = await getToken();
    const res = await fetch(`${BASE_URL}/documents/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new ApiError(err.error?.message ?? "Upload failed", res.status);
    }
    return res.json() as Promise<Document>;
  },
  downloadUrl: (id: string) => apiFetch<DownloadUrlResponse>(`/documents/${id}/download`),
  grantAccess: (id: string, body: GrantAccessRequest) =>
    apiFetch(`/documents/${id}/access`, { method: "POST", body: JSON.stringify(body) }),
  updateStatus: (id: string, body: UpdateDocStatusRequest) =>
    apiFetch(`/documents/${id}/status`, { method: "PATCH", body: JSON.stringify(body) }),
  versions: (id: string) => apiFetch<{ versions: Document[] }>(`/documents/${id}/versions`),
};

// ─── Surveys ─────────────────────────────────────────────────────────────────

export const surveysApi = {
  list: (query?: Record<string, string>) =>
    apiFetch<{ data: Survey[]; meta: unknown }>("/surveys", { params: query }),
  get: (id: string) => apiFetch<Survey>(`/surveys/${id}`),
  create: (body: CreateSurveyRequest) =>
    apiFetch<Survey>("/surveys", { method: "POST", body: JSON.stringify(body) }),
  complete: (id: string, body: CompleteSurveyRequest) =>
    apiFetch<Survey>(`/surveys/${id}/complete`, { method: "PATCH", body: JSON.stringify(body) }),
  cancel: (id: string) =>
    apiFetch<Survey>(`/surveys/${id}/cancel`, { method: "PATCH", body: "{}" }),
};

// ─── Approvals ────────────────────────────────────────────────────────────────

export const approvalsApi = {
  list: (query?: Record<string, string>) =>
    apiFetch<{ data: ApprovalRequest[]; meta: unknown }>("/approvals", { params: query }),
  get: (id: string) => apiFetch<ApprovalRequest>(`/approvals/${id}`),
  create: (body: CreateApprovalRequest) =>
    apiFetch<ApprovalRequest>("/approvals", { method: "POST", body: JSON.stringify(body) }),
  decide: (requestId: string, stepId: string, body: DecideStepRequest) =>
    apiFetch(`/approvals/${requestId}/steps/${stepId}/decide`, {
      method: "POST", body: JSON.stringify(body),
    }),
  cancel: (id: string) =>
    apiFetch(`/approvals/${id}/cancel`, { method: "PATCH", body: "{}" }),
  workflows: () => apiFetch<{ data: ApprovalWorkflow[] }>("/approvals/workflows"),
  createWorkflow: (body: CreateWorkflowRequest) =>
    apiFetch<ApprovalWorkflow>("/approvals/workflows", { method: "POST", body: JSON.stringify(body) }),
};

// ─── Notifications ────────────────────────────────────────────────────────────

export const notificationsApi = {
  list: (params?: { is_read?: boolean; limit?: number }) =>
    apiFetch<ListNotificationsResponse>("/notifications", {
      params: params as Record<string, string>,
    }),
  markRead: (id: string) => apiFetch(`/notifications/${id}/read`, { method: "PATCH", body: "{}" }),
  markAllRead: () => apiFetch("/notifications/read-all", { method: "POST", body: "{}" }),
};

// Deal state machine (Nigerian flow)

export interface DealFlowState {
  id: string;
  path: "cash" | "mortgage";
  state: string;
  tracks: { property: string | null; buyer: string | null };
  perfection: string;
  attribution: { marketerId: string | null; status: string };
  flags: { insured: boolean; disbursed: boolean };
  disbursementPolicy: string;
  moneyEvents: { socket: string; atState: string; amount: number | null; status: string }[];
}
export interface DealFlowResponse { deal: DealFlowState; available: string[]; }

export const transitionsApi = {
  getFlow: (dealId: string) => apiFetch<DealFlowResponse>(`/transitions/${dealId}`),
  fire: (dealId: string, event: string) =>
    apiFetch<{ ok: boolean; deal: DealFlowState; available: string[] }>("/transitions", {
      method: "POST", body: JSON.stringify({ dealId, event }),
    }),
};
