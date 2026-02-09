"use client"

/**
 * HORUS BRAIN - Central Operating System
 * 
 * NOT a chatbot. NOT an assistant.
 * This is the platform's read-only intelligence layer.
 * 
 * - Modules WRITE state
 * - Horus READS state only
 * - Produces state-aware observations
 * - Never guides, never recommends, never explains workflows
 */

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from "react"

// ═══════════════════════════════════════════════════════════════════════════════
// STATE TYPES - Platform Truth
// ═══════════════════════════════════════════════════════════════════════════════

export interface PlatformFile {
  id: string
  name: string
  type: string
  size: number
  contentHash?: string
  analysis?: {
    detectedStandards: ("ISO21001" | "ISO9001" | "NAQAAE")[]
    documentType?: string
    clauses?: string[]
    confidence: number
  }
  uploadedAt: number
  // Cross-module links
  linkedToEvidence?: string[]
  linkedToGaps?: string[]
  // State flags
  isProcessed: boolean
}

export interface EvidenceItem {
  id: string
  title: string
  type: string
  status: "defined" | "linked" | "complete" | "void"
  // References
  sourceFiles: string[]
  criteriaRefs: string[]
  // Metadata
  definedAt: number
  lastModified: number
}

export interface GapItem {
  id: string
  standard: "ISO21001" | "ISO9001" | "NAQAAE"
  clause: string
  description: string
  status: "defined" | "addressed" | "closed" | "dormant"
  // References
  evidenceIds: string[]
  relatedFileIds: string[]
  // Metadata
  definedAt: number
  closedAt?: number
}

export interface DashboardMetric {
  id: string
  name: string
  value: number
  previousValue?: number
  lastUpdated: number
  sourceModule: string
}

export interface PlatformState {
  // Core entities
  files: Map<string, PlatformFile>
  evidence: Map<string, EvidenceItem>
  gaps: Map<string, GapItem>
  metrics: Map<string, DashboardMetric>
  
  // Event log (immutable history)
  events: PlatformEvent[]
  
  // Computed
  lastActivity: number
}

export type PlatformEvent =
  | { type: "file_uploaded"; fileId: string; timestamp: number }
  | { type: "file_analyzed"; fileId: string; standards: string[]; timestamp: number }
  | { type: "evidence_created"; evidenceId: string; timestamp: number }
  | { type: "evidence_linked"; evidenceId: string; fileIds: string[]; timestamp: number }
  | { type: "gap_defined"; gapId: string; timestamp: number }
  | { type: "gap_addressed"; gapId: string; evidenceId: string; timestamp: number }
  | { type: "gap_closed"; gapId: string; timestamp: number }
  | { type: "metric_updated"; metricId: string; value: number; timestamp: number }

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIONS - State Mutations (Modules Write)
// ═══════════════════════════════════════════════════════════════════════════════

type StateAction =
  | { type: "FILE_UPLOADED"; payload: PlatformFile }
  | { type: "FILE_ANALYZED"; payload: { id: string; analysis: PlatformFile["analysis"] } }
  | { type: "EVIDENCE_CREATED"; payload: EvidenceItem }
  | { type: "EVIDENCE_LINKED"; payload: { evidenceId: string; fileIds: string[] } }
  | { type: "GAP_DEFINED"; payload: GapItem }
  | { type: "GAP_ADDRESSED"; payload: { gapId: string; evidenceId: string } }
  | { type: "GAP_CLOSED"; payload: string }
  | { type: "METRIC_UPDATED"; payload: DashboardMetric }
  | { type: "LOG_EVENT"; payload: PlatformEvent }

// ═══════════════════════════════════════════════════════════════════════════════
// REDUCER - State Truth
// ═══════════════════════════════════════════════════════════════════════════════

const initialState: PlatformState = {
  files: new Map(),
  evidence: new Map(),
  gaps: new Map(),
  metrics: new Map(),
  events: [],
  lastActivity: Date.now(),
}

function stateReducer(state: PlatformState, action: StateAction): PlatformState {
  const newFiles = new Map(state.files)
  const newEvidence = new Map(state.evidence)
  const newGaps = new Map(state.gaps)
  const newMetrics = new Map(state.metrics)
  const newEvents = [...state.events]
  
  switch (action.type) {
    case "FILE_UPLOADED":
      newFiles.set(action.payload.id, action.payload)
      newEvents.push({
        type: "file_uploaded",
        fileId: action.payload.id,
        timestamp: Date.now()
      })
      break
      
    case "FILE_ANALYZED": {
      const file = newFiles.get(action.payload.id)
      if (file) {
        file.analysis = action.payload.analysis
        file.isProcessed = true
        newFiles.set(action.payload.id, file)
        newEvents.push({
          type: "file_analyzed",
          fileId: action.payload.id,
          standards: action.payload.analysis?.detectedStandards || [],
          timestamp: Date.now()
        })
      }
      break
    }
      
    case "EVIDENCE_CREATED":
      newEvidence.set(action.payload.id, action.payload)
      newEvents.push({
        type: "evidence_created",
        evidenceId: action.payload.id,
        timestamp: Date.now()
      })
      break
      
    case "EVIDENCE_LINKED": {
      const ev = newEvidence.get(action.payload.evidenceId)
      if (ev) {
        ev.sourceFiles = [...new Set([...ev.sourceFiles, ...action.payload.fileIds])]
        ev.status = ev.sourceFiles.length > 0 ? "linked" : ev.status
        ev.lastModified = Date.now()
        newEvidence.set(action.payload.evidenceId, ev)
        newEvents.push({
          type: "evidence_linked",
          evidenceId: action.payload.evidenceId,
          fileIds: action.payload.fileIds,
          timestamp: Date.now()
        })
      }
      break
    }
      
    case "GAP_DEFINED":
      newGaps.set(action.payload.id, action.payload)
      newEvents.push({
        type: "gap_defined",
        gapId: action.payload.id,
        timestamp: Date.now()
      })
      break
      
    case "GAP_ADDRESSED": {
      const gap = newGaps.get(action.payload.gapId)
      if (gap) {
        gap.evidenceIds = [...new Set([...gap.evidenceIds, action.payload.evidenceId])]
        gap.status = "addressed"
        newGaps.set(action.payload.gapId, gap)
        newEvents.push({
          type: "gap_addressed",
          gapId: action.payload.gapId,
          evidenceId: action.payload.evidenceId,
          timestamp: Date.now()
        })
      }
      break
    }
      
    case "GAP_CLOSED": {
      const gap = newGaps.get(action.payload)
      if (gap) {
        gap.status = "closed"
        gap.closedAt = Date.now()
        newGaps.set(action.payload, gap)
        newEvents.push({
          type: "gap_closed",
          gapId: action.payload,
          timestamp: Date.now()
        })
      }
      break
    }
      
    case "METRIC_UPDATED":
      newMetrics.set(action.payload.id, action.payload)
      newEvents.push({
        type: "metric_updated",
        metricId: action.payload.id,
        value: action.payload.value,
        timestamp: Date.now()
      })
      break
  }
  
  return {
    files: newFiles,
    evidence: newEvidence,
    gaps: newGaps,
    metrics: newMetrics,
    events: newEvents.slice(-1000), // Keep last 1000 events
    lastActivity: Date.now(),
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HORUS CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════

interface HorusContextType {
  state: PlatformState
  
  // Write operations (Modules use these)
  dispatch: React.Dispatch<StateAction>
  
  // Read operations (Horus uses these)
  getFile: (id: string) => PlatformFile | undefined
  getEvidence: (id: string) => EvidenceItem | undefined
  getGap: (id: string) => GapItem | undefined
  getMetric: (id: string) => DashboardMetric | undefined
  
  // Cross-module queries
  getUnlinkedFiles: () => PlatformFile[]
  getOrphanedEvidence: () => EvidenceItem[]
  getAddressableGaps: () => GapItem[]
  getStaleMetrics: () => DashboardMetric[]
  
  // State snapshots
  getStateSummary: () => StateSummary
  getRecentEvents: (count: number) => PlatformEvent[]
}

export interface StateSummary {
  fileCount: number
  processedFileCount: number
  unlinkedFileCount: number
  evidenceCount: number
  linkedEvidenceCount: number
  gapCount: number
  addressedGapCount: number
  closedGapCount: number
  metricCount: number
  lastEventType?: string
  lastEventTime?: number
}

const HorusBrainContext = createContext<HorusContextType | null>(null)

export function HorusBrainProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(stateReducer, initialState)
  
  // Read operations
  const getFile = useCallback((id: string) => state.files.get(id), [state.files])
  const getEvidence = useCallback((id: string) => state.evidence.get(id), [state.evidence])
  const getGap = useCallback((id: string) => state.gaps.get(id), [state.gaps])
  const getMetric = useCallback((id: string) => state.metrics.get(id), [state.metrics])
  
  // Cross-module queries
  const getUnlinkedFiles = useCallback(() => {
    return Array.from(state.files.values()).filter(f => 
      !f.linkedToEvidence || f.linkedToEvidence.length === 0
    )
  }, [state.files])
  
  const getOrphanedEvidence = useCallback(() => {
    return Array.from(state.state.evidence.values()).filter(e => 
      e.sourceFiles.length === 0 && e.status === "defined"
    )
  }, [state.evidence])
  
  const getAddressableGaps = useCallback(() => {
    return Array.from(state.gaps.values()).filter(g => 
      g.status === "defined" && g.relatedFileIds.length > 0
    )
  }, [state.gaps])
  
  const getStaleMetrics = useCallback(() => {
    const threshold = Date.now() - 24 * 60 * 60 * 1000 // 24 hours
    return Array.from(state.metrics.values()).filter(m => 
      m.lastUpdated < threshold
    )
  }, [state.metrics])
  
  // State snapshots
  const getStateSummary = useCallback((): StateSummary => {
    const files = Array.from(state.files.values())
    const evidence = Array.from(state.evidence.values())
    const gaps = Array.from(state.gaps.values())
    
    return {
      fileCount: files.length,
      processedFileCount: files.filter(f => f.isProcessed).length,
      unlinkedFileCount: files.filter(f => !f.linkedToEvidence || f.linkedToEvidence.length === 0).length,
      evidenceCount: evidence.length,
      linkedEvidenceCount: evidence.filter(e => e.sourceFiles.length > 0).length,
      gapCount: gaps.length,
      addressedGapCount: gaps.filter(g => g.status === "addressed").length,
      closedGapCount: gaps.filter(g => g.status === "closed").length,
      metricCount: state.metrics.size,
      lastEventType: state.events[state.events.length - 1]?.type,
      lastEventTime: state.events[state.events.length - 1]?.timestamp,
    }
  }, [state])
  
  const getRecentEvents = useCallback((count: number) => {
    return state.events.slice(-count)
  }, [state.events])
  
  const value: HorusContextType = {
    state,
    dispatch,
    getFile,
    getEvidence,
    getGap,
    getMetric,
    getUnlinkedFiles,
    getOrphanedEvidence,
    getAddressableGaps,
    getStaleMetrics,
    getStateSummary,
    getRecentEvents,
  }
  
  return (
    <HorusBrainContext.Provider value={value}>
      {children}
    </HorusBrainContext.Provider>
  )
}

export function useHorusBrain() {
  const context = useContext(HorusBrainContext)
  if (!context) {
    throw new Error("useHorusBrain must be used within HorusBrainProvider")
  }
  return context
}
