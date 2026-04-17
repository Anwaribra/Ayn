import { GapItem as ContractGapItem, GapAnalysisResponse, GapAnalysisListItem as ContractGapListItem } from "./contracts"

export type GapItem = ContractGapItem
export type GapAnalysis = GapAnalysisResponse & {
  analysisScope?: "linked" | "recent" | "selected"
  evidenceCount?: number | null
  isFallback?: boolean
}

export type GapAnalysisListItem = ContractGapListItem & {
  analysisScope?: "linked" | "recent" | "selected"
  evidenceCount?: number | null
  isFallback?: boolean
}
