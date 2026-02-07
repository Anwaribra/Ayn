// Core types for the Horus Engine Platform

export type AssessmentStatus = "DRAFT" | "SUBMITTED" | "REVIEWED"

export interface User {
  id: string
  name: string
  email: string
  institutionId: string | null
  createdAt: string
}

export interface Institution {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  userCount?: number
}

export interface Standard {
  id: string
  title: string
  description: string | null
}

export interface Criterion {
  id: string
  standardId: string
  title: string
  description: string | null
}

export interface Assessment {
  id: string
  institutionId: string
  userId: string
  status: AssessmentStatus
  createdAt: string
  updatedAt: string
  submittedAt: string | null
  reviewedAt: string | null
  reviewerComment: string | null
  answers: AssessmentAnswer[]
  standardId?: string | null
  institution?: Institution
  user?: User
}

export interface AssessmentAnswer {
  id: string
  assessmentId: string
  criterionId: string
  answer: string
  reviewerComment: string | null
  criterion?: Criterion
}

export interface Evidence {
  id: string
  criterionId: string | null
  fileUrl: string
  fileName?: string
  fileType?: string
  uploadedById: string
  createdAt: string
  updatedAt: string
  criterion?: Criterion
}

export interface Notification {
  id: string
  userId: string
  title: string
  body: string
  read: boolean
  createdAt: string
  updatedAt: string
}

export interface DashboardMetrics {
  completedCriteriaCount: number
  evidenceCount: number
  assessmentProgressPercentage: number
  totalAssessments: number
}

export interface AuthResponse {
  user: User
  access_token: string
  token_type: string
}

export interface AIResponse {
  result: string
  model: string
}

// Gap Analysis types
export interface GapItem {
  criterionId: string
  criterionTitle: string
  status: "met" | "partially_met" | "not_met" | "no_evidence"
  currentState: string
  gap: string
  recommendation: string
  priority: "high" | "medium" | "low"
}

export interface GapAnalysis {
  id: string
  institutionId: string
  standardId: string
  standardTitle: string
  assessmentId: string | null
  overallScore: number
  summary: string
  gaps: GapItem[]
  recommendations: string[]
  archived: boolean
  createdAt: string
}

export interface GapAnalysisListItem {
  id: string
  standardTitle: string
  overallScore: number
  summary: string
  archived: boolean
  createdAt: string
}
