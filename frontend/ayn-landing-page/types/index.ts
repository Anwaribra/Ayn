// Barrel export — re-exports every domain type for convenient single-import

export type { User, Institution, AuthResponse } from "./user"
export type { Standard, Criterion } from "./standards"
export type { Evidence } from "./evidence"
export type {
  GapItem,
  GapAnalysis,
  GapAnalysisListItem,
} from "./gap-analysis"
export type {
  AssessmentStatus,
  Assessment,
  AssessmentAnswer,
} from "./assessment"
export type { Notification } from "./notification"
export type { DashboardMetrics } from "./dashboard"
export type { AIResponse } from "./ai"
export type {
  PlatformFile,
  PlatformEvidence,
  PlatformGap,
  PlatformMetric,
  PlatformEvent,
  StateSummary,
} from "../lib/types"
