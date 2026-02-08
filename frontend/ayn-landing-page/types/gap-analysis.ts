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
