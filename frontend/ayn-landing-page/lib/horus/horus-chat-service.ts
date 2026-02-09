"use client"

/**
 * HORUS CHAT SERVICE
 * 
 * Read-only intelligence layer.
 * Describes state. Never prescribes action.
 */

import { useHorusBrain, type StateSummary } from "./horus-brain-context"

// ═══════════════════════════════════════════════════════════════════════════════
// RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface HorusObservation {
  id: string
  timestamp: number
  content: string
  context: {
    referencedFiles?: string[]
    referencedEvidence?: string[]
    referencedGaps?: string[]
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATE OBSERVATION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export function useHorusObserver() {
  const brain = useHorusBrain()
  
  const observe = (query?: string): HorusObservation => {
    const summary = brain.getStateSummary()
    const unlinked = brain.getUnlinkedFiles()
    const addressable = brain.getAddressableGaps()
    const recent = brain.getRecentEvents(5)
    
    // Build observation based on query and state
    const content = buildObservation(query, summary, unlinked, addressable, recent)
    
    return {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      content,
      context: {
        referencedFiles: unlinked.map(f => f.id),
        referencedEvidence: [],
        referencedGaps: addressable.map(g => g.id),
      }
    }
  }
  
  return { observe }
}

function buildObservation(
  query: string | undefined,
  summary: StateSummary,
  unlinkedFiles: ReturnType<typeof useHorusBrain>["getUnlinkedFiles"],
  addressableGaps: ReturnType<typeof useHorusBrain>["getAddressableGaps"],
  recentEvents: ReturnType<typeof useHorusBrain>["getRecentEvents"]
): string {
  
  const lines: string[] = []
  
  // State summary (always present)
  lines.push("Platform state:")
  lines.push(`- Files: ${summary.fileCount} (${summary.processedFileCount} analyzed, ${summary.unlinkedFileCount} unlinked)`)
  lines.push(`- Evidence scopes: ${summary.evidenceCount} (${summary.linkedEvidenceCount} linked)`)
  lines.push(`- Gaps: ${summary.gapCount} (${summary.addressedGapCount} addressed, ${summary.closedGapCount} closed)`)
  lines.push(`- Metrics: ${summary.metricCount}`)
  
  // Cross-module relationships
  if (unlinkedFiles.length > 0) {
    lines.push(``)
    lines.push(`Unlinked files (${unlinkedFiles.length}):`)
    unlinkedFiles.slice(0, 3).forEach(f => {
      const standards = f.analysis?.detectedStandards?.join(", ") || "unanalyzed"
      lines.push(`- ${f.name}: ${standards}`)
    })
    if (unlinkedFiles.length > 3) {
      lines.push(`- ... and ${unlinkedFiles.length - 3} more`)
    }
  }
  
  if (addressableGaps.length > 0) {
    lines.push(``)
    lines.push(`Gaps with potential file matches (${addressableGaps.length}):`)
    addressableGaps.slice(0, 3).forEach(g => {
      lines.push(`- ${g.standard} ${g.clause}: ${g.relatedFileIds.length} potential file(s)`)
    })
  }
  
  // Recent activity
  if (recentEvents.length > 0) {
    lines.push(``)
    lines.push("Recent events:")
    recentEvents.slice(-3).reverse().forEach(e => {
      const time = new Date(e.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      lines.push(`- [${time}] ${e.type}`)
    })
  }
  
  // Specific query handling (state description only)
  if (query) {
    const lower = query.toLowerCase()
    
    if (lower.includes("file") && unlinkedFiles.length === 0 && summary.fileCount > 0) {
      lines.push(``)
      lines.push("All uploaded files are linked to evidence scopes.")
    }
    
    if (lower.includes("gap") && summary.gapCount === 0) {
      lines.push(``)
      lines.push("No gaps defined in current state.")
    }
    
    if (lower.includes("complete") || lower.includes("status")) {
      const complete = summary.linkedEvidenceCount > 0 && summary.unlinkedFileCount === 0
      lines.push(``)
      lines.push(`Completeness: ${complete ? "Files linked to evidence." : "Unlinked files remain."}`)
    }
  }
  
  return lines.join("\n")
}

// ═══════════════════════════════════════════════════════════════════════════════
// FILE UPLOAD HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

export function useFileUploadHandler() {
  const brain = useHorusBrain()
  
  const handleUpload = async (file: File): Promise<string> => {
    const id = crypto.randomUUID()
    
    // Create file entry
    brain.dispatch({
      type: "FILE_UPLOADED",
      payload: {
        id,
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: Date.now(),
        isProcessed: false,
      }
    })
    
    // Simulate analysis (async)
    setTimeout(() => {
      const standards = detectStandards(file.name)
      brain.dispatch({
        type: "FILE_ANALYZED",
        payload: {
          id,
          analysis: {
            detectedStandards: standards,
            confidence: standards.length > 0 ? 0.75 : 0.3
          }
        }
      })
    }, 100)
    
    return id
  }
  
  return { handleUpload }
}

function detectStandards(filename: string): ("ISO21001" | "ISO9001" | "NAQAAE")[] {
  const name = filename.toLowerCase()
  const standards: ("ISO21001" | "ISO9001" | "NAQAAE")[] = []
  
  // ISO 9001 indicators
  if (name.includes("quality") || name.includes("manual") || name.includes("qms")) {
    standards.push("ISO9001")
  }
  
  // ISO 21001 indicators
  if (name.includes("educational") || name.includes("eoms") || name.includes("learner")) {
    standards.push("ISO21001")
  }
  
  // NAQAAE indicators
  if (name.includes("naqaae") || name.includes("accreditation") || name.includes("egypt")) {
    standards.push("NAQAAE")
  }
  
  // Default if no specific indicators
  if (standards.length === 0) {
    standards.push("ISO21001")
  }
  
  return standards
}
