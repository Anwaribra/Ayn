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
