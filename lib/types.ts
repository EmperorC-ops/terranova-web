// lib/types.ts — merged Terranova domain types (standalone; no workspace package)

// ─── Enums — mirror Postgres enum types exactly ──────────────────────────────

export type UserRole =
  | "admin"
  | "manager"
  | "agent"
  | "client"
  | "lawyer"
  | "surveyor";

export type OrgType =
  | "internal"
  | "law_firm"
  | "surveyor"
  | "buyer"
  | "seller";

export type PropertyType =
  | "residential"
  | "commercial"
  | "industrial"
  | "land";

export type PropertyStatus =
  | "available"
  | "under_offer"
  | "sold"
  | "off_market";

export type DealType = "sale" | "lease" | "acquisition";

export type DealStage =
  | "lead"
  | "site_visit"
  | "negotiation"
  | "due_diligence"
  | "closed"
  | "lost";

export type DealPriority = "low" | "medium" | "high";

export type DealRole =
  | "agent"
  | "buyer_rep"
  | "seller_rep"
  | "legal"
  | "surveyor"
  | "observer";

export type DocType =
  | "contract"
  | "title_deed"
  | "survey"
  | "permit"
  | "valuation"
  | "id_doc"
  | "other";

export type DocStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "signed";

export type DocPermission = "view" | "comment" | "edit" | "sign";

export type SurveyType =
  | "structural"
  | "environmental"
  | "topographic"
  | "valuation"
  | "boundary";

export type SurveyStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export type ApprovalTrigger =
  | "manual"
  | "deal_stage"
  | "document_upload"
  | "survey_complete";

export type ApprovalStatus =
  | "pending"
  | "in_progress"
  | "approved"
  | "rejected"
  | "cancelled";

export type StepStatus =
  | "pending"
  | "in_progress"
  | "approved"
  | "rejected"
  | "skipped";

export type ActivityType =
  | "stage_change"
  | "note"
  | "call"
  | "site_visit"
  | "offer"
  | "document_added"
  | "survey_scheduled";

export type NotificationType =
  | "approval_needed"
  | "deal_update"
  | "doc_uploaded"
  | "survey_due"
  | "mention"
  | "stage_change";

// ─── RBAC — which roles can do what ──────────────────────────────────────────
export const INTERNAL_ROLES: UserRole[] = ["admin", "manager", "agent"];
export const EXTERNAL_ROLES: UserRole[] = ["client", "lawyer", "surveyor"];

export const ROLE_PERMISSIONS: Record<UserRole, {
  properties: string[];
  deals: string[];
  documents: string[];
  surveys: string[];
  approvals: string[];
}> = {
  admin: {
    properties: ["read", "create", "update", "delete"],
    deals: ["read", "create", "update", "delete"],
    documents: ["read", "upload", "update", "delete", "grant_access"],
    surveys: ["read", "create", "update", "delete"],
    approvals: ["read", "create", "decide", "cancel"],
  },
  manager: {
    properties: ["read", "create", "update"],
    deals: ["read", "create", "update"],
    documents: ["read", "upload", "update", "grant_access"],
    surveys: ["read", "create", "update"],
    approvals: ["read", "create", "decide"],
  },
  agent: {
    properties: ["read", "create", "update"],
    deals: ["read", "create", "update"],
    documents: ["read", "upload"],
    surveys: ["read", "create"],
    approvals: ["read", "create"],
  },
  client: {
    properties: ["read_own"],
    deals: ["read_own"],
    documents: ["read_granted"],
    surveys: [],
    approvals: [],
  },
  lawyer: {
    properties: ["read_own"],
    deals: ["read_own"],
    documents: ["read_granted", "upload", "update_status"],
    surveys: [],
    approvals: ["read_own", "decide_assigned"],
  },
  surveyor: {
    properties: ["read_own"],
    deals: [],
    documents: ["read_granted", "upload"],
    surveys: ["read_assigned", "update_assigned"],
    approvals: [],
  },
};


// ─── Auth & People ────────────────────────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  type: OrgType;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  org_id: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
  // Joined
  organization?: Organization;
}

export interface AuthToken {
  id: string;
  user_id: string;
  token_hash: string;
  family_id: string;
  is_revoked: boolean;
  expires_at: string;
  created_at: string;
}

// ─── Properties ───────────────────────────────────────────────────────────────

export interface Property {
  id: string;
  name: string;
  type: PropertyType;
  status: PropertyStatus;
  address: string;
  lat: number | null;
  lng: number | null;
  area_sqft: number | null;
  zoning_code: string | null;
  parcel_id: string | null;
  site_score: number | null;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined
  creator?: Pick<User, "id" | "full_name">;
}

export interface PropertyWithDetails extends Property {
  deals: Pick<Deal, "id" | "stage" | "value" | "currency" | "priority">[];
  documents: Pick<Document, "id" | "name" | "type" | "status">[];
  surveys: Pick<Survey, "id" | "type" | "status" | "scheduled_date">[];
  open_approvals: number;
}

// ─── Deals ────────────────────────────────────────────────────────────────────

export interface Deal {
  id: string;
  property_id: string;
  stage: DealStage;
  deal_type: DealType;
  value: number;
  currency: string;
  buyer_org_id: string | null;
  seller_org_id: string | null;
  assigned_agent_id: string;
  priority: DealPriority;
  expected_close_date: string | null;
  closed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  property?: Pick<Property, "id" | "name" | "type" | "address">;
  assigned_agent?: Pick<User, "id" | "full_name" | "avatar_url">;
  buyer_org?: Pick<Organization, "id" | "name">;
  seller_org?: Pick<Organization, "id" | "name">;
  days_in_stage?: number;
}

export interface DealParticipant {
  id: string;
  deal_id: string;
  user_id: string;
  role: DealRole;
  added_at: string;
  added_by: string;
  // Joined
  user?: Pick<User, "id" | "full_name" | "email" | "role" | "avatar_url">;
}

export interface DealActivity {
  id: string;
  deal_id: string;
  actor_id: string;
  type: ActivityType;
  payload: ActivityPayload;
  created_at: string;
  // Joined
  actor?: Pick<User, "id" | "full_name" | "role" | "avatar_url">;
}

export type ActivityPayload =
  | { type: "stage_change"; from: DealStage; to: DealStage; note?: string }
  | { type: "note"; body: string }
  | { type: "call"; duration_minutes?: number; summary?: string }
  | { type: "site_visit"; outcome?: string }
  | { type: "offer"; amount: number; currency: string; note?: string }
  | { type: "document_added"; document_id: string; document_name: string }
  | { type: "survey_scheduled"; survey_id: string; survey_type: SurveyType };

// ─── Documents ────────────────────────────────────────────────────────────────

export interface Document {
  id: string;
  property_id: string;
  deal_id: string | null;
  name: string;
  type: DocType;
  status: DocStatus;
  storage_key: string;
  file_size_bytes: number;
  mime_type: string;
  version: number;
  parent_doc_id: string | null;
  uploaded_by: string;
  uploaded_at: string;
  // Joined
  uploader?: Pick<User, "id" | "full_name" | "role">;
  property?: Pick<Property, "id" | "name">;
}

export interface DocumentAccess {
  id: string;
  document_id: string;
  user_id: string | null;
  org_id: string | null;
  permission: DocPermission;
  granted_by: string;
  expires_at: string | null;
  created_at: string;
  // Joined
  user?: Pick<User, "id" | "full_name" | "email">;
  org?: Pick<Organization, "id" | "name">;
}

// ─── Surveys ──────────────────────────────────────────────────────────────────

export interface Survey {
  id: string;
  property_id: string;
  deal_id: string | null;
  type: SurveyType;
  status: SurveyStatus;
  assigned_to_id: string;
  assigned_org_id: string | null;
  scheduled_date: string;
  completed_date: string | null;
  findings: string | null;
  score: number | null;
  report_doc_id: string | null;
  created_by: string;
  created_at: string;
  // Joined
  property?: Pick<Property, "id" | "name">;
  assigned_to?: Pick<User, "id" | "full_name" | "email">;
  assigned_org?: Pick<Organization, "id" | "name">;
}

// ─── Approvals ────────────────────────────────────────────────────────────────

export interface WorkflowStepDefinition {
  name: string;
  assigned_role?: UserRole;
  assigned_user_id?: string;
  order: number;
}

export interface ApprovalWorkflow {
  id: string;
  name: string;
  trigger_type: ApprovalTrigger;
  steps: WorkflowStepDefinition[];
  is_active: boolean;
  created_at: string;
}

export interface ApprovalRequest {
  id: string;
  workflow_id: string;
  deal_id: string | null;
  document_id: string | null;
  property_id: string | null;
  status: ApprovalStatus;
  current_step_index: number;
  priority: DealPriority;
  deadline: string | null;
  submitted_by: string;
  created_at: string;
  resolved_at: string | null;
  // Joined
  workflow?: Pick<ApprovalWorkflow, "id" | "name">;
  deal?: Pick<Deal, "id"> & { property?: Pick<Property, "id" | "name"> };
  steps?: ApprovalStep[];
  progress_pct?: number;
}

export interface ApprovalStep {
  id: string;
  request_id: string;
  step_index: number;
  name: string;
  assigned_to_id: string | null;
  assigned_role_slug: UserRole | null;
  status: StepStatus;
  decision_note: string | null;
  decided_by: string | null;
  decided_at: string | null;
  // Joined
  assigned_to?: Pick<User, "id" | "full_name" | "role">;
  decider?: Pick<User, "id" | "full_name">;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  entity_type: "deal" | "document" | "survey" | "approval" | "property";
  entity_id: string;
  is_read: boolean;
  created_at: string;
}

// ─── JWT Payload ──────────────────────────────────────────────────────────────

export interface JWTPayload {
  sub: string;        // user.id
  email: string;
  role: UserRole;
  org_id: string | null;
  iat: number;
  exp: number;
  jti: string;        // unique token ID
}


// ─── Shared ───────────────────────────────────────────────────────────────────

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    field?: string | null;
  };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: Pick<User, "id" | "email" | "full_name" | "role" | "org_id" | "avatar_url">;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface RefreshResponse {
  access_token: string;
  expires_in: number;
}

export interface MeResponse extends Pick<User, "id" | "email" | "full_name" | "role" | "org_id" | "avatar_url"> {
  permissions: Record<string, string[]>;
  organization?: Pick<Organization, "id" | "name" | "type">;
}

export interface InviteRequest {
  email: string;
  role: Extract<UserRole, "client" | "lawyer" | "surveyor">;
  org_id?: string;
  deal_id?: string;
  property_id?: string;
}

export interface InviteResponse {
  invitation_id: string;
  email: string;
  expires_at: string;
}

// ─── Properties ───────────────────────────────────────────────────────────────

export interface CreatePropertyRequest {
  name: string;
  type: PropertyType;
  address: string;
  lat?: number;
  lng?: number;
  area_sqft?: number;
  zoning_code?: string;
  parcel_id?: string;
  description?: string;
}

export interface UpdatePropertyRequest {
  name?: string;
  status?: PropertyStatus;
  address?: string;
  lat?: number;
  lng?: number;
  area_sqft?: number;
  zoning_code?: string;
  site_score?: number;
  description?: string;
}

export interface ListPropertiesQuery {
  status?: PropertyStatus;
  type?: PropertyType;
  lat?: number;
  lng?: number;
  radius_km?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ListPropertiesResponse extends PaginatedResponse<Property> {}

export interface PropertyTimelineEvent {
  type: string;
  actor: Pick<User, "id" | "full_name" | "role"> | null;
  timestamp: string;
  payload: Record<string, unknown>;
}

// ─── Deals ────────────────────────────────────────────────────────────────────

export interface CreateDealRequest {
  property_id: string;
  deal_type: DealType;
  value: number;
  currency?: string;
  buyer_org_id?: string;
  seller_org_id?: string;
  assigned_agent_id: string;
  priority?: DealPriority;
  expected_close_date?: string;
  notes?: string;
}

export interface UpdateDealStageRequest {
  stage: DealStage;
  note?: string;
}

export interface ListDealsQuery {
  stage?: DealStage;
  agent_id?: string;
  property_id?: string;
  priority?: DealPriority;
  page?: number;
  limit?: number;
}

export interface ListDealsResponse extends PaginatedResponse<Deal> {
  meta: PaginationMeta & { pipeline_value: number };
}

export interface AddParticipantRequest {
  user_id: string;
  role: DealRole;
}

export interface LogActivityRequest {
  type: "note" | "call" | "site_visit" | "offer";
  payload: Record<string, unknown>;
}

// ─── Documents ────────────────────────────────────────────────────────────────

export interface UploadDocumentRequest {
  property_id: string;
  deal_id?: string;
  type: DocType;
  name: string;
  // file: File — handled as multipart, not typed here
}

export interface ListDocumentsQuery {
  property_id?: string;
  deal_id?: string;
  type?: DocType;
  status?: string;
  page?: number;
  limit?: number;
}

export interface DownloadUrlResponse {
  url: string;
  expires_at: string;
}

export interface GrantAccessRequest {
  user_id?: string;
  org_id?: string;
  permission: DocPermission;
  expires_at?: string;
}

export interface UpdateDocStatusRequest {
  status: DocStatus;
  note?: string;
}

// ─── Surveys ─────────────────────────────────────────────────────────────────

export interface CreateSurveyRequest {
  property_id: string;
  deal_id?: string;
  type: SurveyType;
  assigned_to_id: string;
  assigned_org_id?: string;
  scheduled_date: string;
}

export interface CompleteSurveyRequest {
  findings: string;
  score?: number;
  report_doc_id?: string;
}

// ─── Approvals ────────────────────────────────────────────────────────────────

export interface CreateWorkflowRequest {
  name: string;
  trigger_type: ApprovalTrigger;
  steps: WorkflowStepDefinition[];
}

export interface CreateApprovalRequest {
  workflow_id: string;
  deal_id?: string;
  document_id?: string;
  property_id?: string;
  priority?: DealPriority;
  deadline?: string;
}

export interface DecideStepRequest {
  decision: Extract<StepStatus, "approved" | "rejected">;
  note?: string;
}

export interface DecideStepResponse {
  step_id: string;
  status: StepStatus;
  decided_at: string;
  next_step: Pick<ApprovalStep, "id" | "name" | "assigned_to_id" | "assigned_role_slug"> | null;
  request_resolved: boolean;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface ListNotificationsQuery {
  is_read?: boolean;
  limit?: number;
}

export interface ListNotificationsResponse {
  data: Notification[];
  unread_count: number;
}

// ─── Realtime event payloads ──────────────────────────────────────────────────

export interface RealtimeDealStageChanged {
  deal_id: string;
  property_name: string;
  from_stage: DealStage;
  to_stage: DealStage;
  actor: Pick<User, "id" | "full_name">;
  deal_value: number;
  timestamp: string;
}

export interface RealtimeDocumentUploaded {
  document_id: string;
  name: string;
  type: DocType;
  version: number;
  uploaded_by: Pick<User, "full_name">;
  timestamp: string;
}

export interface RealtimeApprovalStepDecided {
  request_id: string;
  step_index: number;
  step_name: string;
  decision: "approved" | "rejected";
  decided_by: Pick<User, "full_name">;
  next_step: { name: string; assigned_to?: string } | null;
  progress_pct: number;
  timestamp: string;
}

export interface RealtimeNotificationCreated extends Notification {}
