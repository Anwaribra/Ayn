"use client"

export const DEMO_MODE_KEY = "ayn_demo_mode"

export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(DEMO_MODE_KEY) === "enabled"
}

export function toggleDemoMode(): boolean {
  const current = isDemoMode()
  const next = !current
  localStorage.setItem(DEMO_MODE_KEY, next ? "enabled" : "disabled")
  return next
}

export const MOCK_AI_RESPONSES: Record<string, string> = {
  "default": "Based on my analysis of the platform state, system integrity is currently at 94%. I recommend reviewing the latest NAQAAE criteria mappings to close the remaining documentation gaps.",
  "gap_analysis": "Scanning complete. I have identified 3 High-Severity gaps in Clause 7.5 (Documented Information). Recommended action: Standardize evidence collection for internal audits.",
  "evidence_vault": "The Evidence Vault is synchronized. I've verified 12 new documents. Note that the Strategic Plan is missing a valid approval signature for ISO 21001 compliance.",
}

export function getMockResponse(prompt: string): string {
  const lower = prompt.toLowerCase()
  if (lower.includes("gap")) return MOCK_AI_RESPONSES.gap_analysis
  if (lower.includes("evidence")) return MOCK_AI_RESPONSES.evidence_vault
  return MOCK_AI_RESPONSES.default
}
