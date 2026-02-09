// Re-export all types from the canonical @/types directory.
// Prefer importing directly from "@/types" or "@/types/<domain>" in new code.

export type {
  User,
  Institution,
  AuthResponse,
  Standard,
  Criterion,
  Evidence,
  GapItem,
  GapAnalysis,
  GapAnalysisListItem,
  AssessmentStatus,
  Assessment,
  AssessmentAnswer,
  Notification,
  DashboardMetrics,
  AIResponse,
} from "@/types"

// ═══════════════════════════════════════════════════════════════════════════
// PLATFORM STATE TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface PlatformFile {
  id: string
  name: string
  type: string
  size: number
  user_id: string
  detected_standards: string[]
  document_type?: string
  clauses: string[]
  analysis_confidence: number
  status: "uploaded" | "analyzed" | "linked" | "orphaned"
  linked_evidence_ids: string[]
  linked_gap_ids: string[]
  created_at: string
  updated_at: string
}

export interface PlatformEvidence {
  id: string
  title: string
  type: string
  user_id: string
  status: "defined" | "linked" | "complete" | "void"
  source_file_ids: string[]
  criteria_refs: string[]
  created_at: string
  updated_at: string
}

export interface PlatformGap {
  id: string
  standard: string
  clause: string
  description: string
  severity: "critical" | "high" | "medium" | "low"
  user_id: string
  status: "defined" | "addressed" | "closed" | "dormant"
  evidence_ids: string[]
  related_file_ids: string[]
  created_at: string
  closed_at?: string
}

export interface PlatformMetric {
  id: string
  name: string
  value: number
  previous_value?: number
  source_module: string
  user_id: string
  updated_at: string
}

export interface PlatformEvent {
  id: string
  type: string
  user_id: string
  entity_id?: string
  metadata: Record<string, unknown>
  timestamp: string
}

export interface StateSummary {
  total_files: number
  analyzed_files: number
  unlinked_files: number
  total_evidence: number
  linked_evidence: number
  total_gaps: number
  addressed_gaps: number
  closed_gaps: number
  total_metrics: number
  last_event_type?: string
  last_event_time?: string
  orphan_files: PlatformFile[]
  addressable_gaps: PlatformGap[]
}
