/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * This file was generated from Pydantic models in the backend.
 */

export interface AIResponse {
  result?: string;
  raw_text?: string;
  structured?: any;
  error?: string;
  analysis_id?: string;
  metrics_updated?: boolean;
  model: string;
}

export interface ArchiveRequest {
  archived: boolean;
}



export interface AssignUserRequest {
  userId: string;
}

export interface AssignUserResponse {
  message: string;
  userId: string;
  institutionId: string;
}

export interface AttachEvidenceRequest {
  criterionId: string;
}

export interface AttachEvidenceResponse {
  message: string;
  evidenceId: string;
  criterionId: string;
}

export interface AuthResponse {
  user: UserResponse;
  access_token: string;
  token_type: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  context: string | null;
}

export interface CommentRequest {
  text: string;
  focus: string | null;
}

export interface CriterionCreateRequest {
  title: string;
  description: string | null;
}

export interface CriterionResponse {
  id: string;
  standardId: string;
  title: string;
  description: string | null;
}

export interface CriterionUpdateRequest {
  title: string | null;
  description: string | null;
}

export interface DashboardMetricsResponse {
  alignedCriteriaCount: number;
  evidenceCount: number;
  alignmentPercentage: number;
  totalGapAnalyses: number;
}

export interface EvidenceResponse {
  id: string;
  criterionId: string | null;
  fileUrl: string;
  uploadedById: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExplainRequest {
  topic: string;
  level: string | null;
}

export interface ExtractEvidenceRequest {
  text: string;
  criteria: string | null;
}

export interface GapAnalysisListItem {
  id: string;
  standardTitle: string;
  overallScore: number;
  summary: string;
  archived: boolean;
  createdAt: string;
}

export interface GapAnalysisRequest {
  standardId: string;
}

export interface GapAnalysisResponse {
  id: string;
  institutionId: string;
  standardId: string;
  standardTitle: string;
  overallScore: number;
  summary: string;
  gaps: GapItem[];
  recommendations: string[];
  archived: boolean;
  createdAt: string;
}

export interface GapItem {
  criterionId: string;
  criterionTitle: string;
  status: string;
  currentState: string;
  gap: string;
  recommendation: string;
  priority: string;
}

export interface GenerateAnswerRequest {
  prompt: string;
  context: string | null;
}

export interface GoogleLoginRequest {
  id_token: string;
}

export interface InstitutionCreateRequest {
  name: string;
  description: string | null;
}

export interface InstitutionResponse {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InstitutionUpdateRequest {
  name: string | null;
  description: string | null;
}

export interface InstitutionWithUsersResponse {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  userCount: number;
}

export interface LinkStandardRequest {
  standardId: string;
}

export interface LinkStandardResponse {
  message: string;
  institutionId: string;
  standardId: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LogoutResponse {
  message: string;
}

export interface MarkReadResponse {
  message: string;
  notificationId: string;
  read: boolean;
}

export interface NotificationCreateRequest {
  userId: string;
  title: string;
  body: string;
}

export interface NotificationResponse {
  id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformEvent {
  id: string;
  type: string;
  user_id: string;
  entity_id: string | null;
  metadata: Record<string, any>;
  timestamp: string;
}

export interface PlatformEvidence {
  id: string;
  title: string;
  type: string;
  user_id: string;
  status: string;
  source_file_ids: string[];
  criteria_refs: string[];
  created_at: string;
  updated_at: string;
}

export interface PlatformFile {
  id: string;
  name: string;
  type: string;
  size: number;
  user_id: string;
  detected_standards: string[];
  document_type: string | null;
  clauses: string[];
  analysis_confidence: number;
  status: string;
  linked_evidence_ids: string[];
  linked_gap_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface PlatformGap {
  id: string;
  standard: string;
  clause: string;
  description: string;
  severity: string;
  user_id: string;
  status: string;
  evidence_ids: string[];
  related_file_ids: string[];
  created_at: string;
  closed_at: string | null;
}

export interface PlatformMetric {
  id: string;
  name: string;
  value: number;
  previous_value: number | null;
  source_module: string;
  user_id: string;
  updated_at: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: string | null;
  institutionId: string | null;
}


export interface StandardCreateRequest {
  title: string;
  code: string | null;
  category: string | null;
  description: string | null;
  region: string | null;
  icon: string | null;
  color: string | null;
  features: string[];
  estimatedSetup: string | null;
}

export interface StandardResponse {
  id: string;
  title: string;
  code: string | null;
  category: string | null;
  description: string | null;
  region: string | null;
  icon: string | null;
  color: string | null;
  features: string[];
  estimatedSetup: string | null;
  criteriaCount: number;
}

export interface StandardUpdateRequest {
  title: string | null;
  code: string | null;
  category: string | null;
  description: string | null;
  region: string | null;
  icon: string | null;
  color: string | null;
  features: string[] | null;
  estimatedSetup: string | null;
}

export interface StandardWithCriteriaResponse {
  id: string;
  title: string;
  code: string | null;
  category: string | null;
  description: string | null;
  region: string | null;
  icon: string | null;
  color: string | null;
  features: string[];
  estimatedSetup: string | null;
  criteriaCount: number;
  criteria: CriterionResponse[];
}

export interface StateSummary {
  total_files: number;
  analyzed_files: number;
  unlinked_files: number;
  total_evidence: number;
  linked_evidence: number;
  total_gaps: number;
  addressed_gaps: number;
  closed_gaps: number;
  total_metrics: number;
  last_event_type: string | null;
  last_event_time: string | null;
  orphan_files: PlatformFile[];
  addressable_gaps: PlatformGap[];
}


export interface SummarizeRequest {
  content: string;
  maxLength: number | null;
}

export interface SupabaseLoginRequest {
  access_token: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UpdateUserRequest {
  name: string | null;
}

export interface UploadEvidenceResponse {
  message: string;
  evidence: EvidenceResponse;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: string | null;
  institutionId: string | null;
  createdAt: string;
}
