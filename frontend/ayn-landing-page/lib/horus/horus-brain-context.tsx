"use client"

/**
 * HORUS BRAIN - Central Intelligence Context
 * 
 * This is the core of the platform architecture.
 * Horus AI is not just a chatbot - it's the shared intelligence layer
 * that connects all platform modules.
 */

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from "react"

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface AnalyzedFile {
  id: string
  name: string
  type: string
  size: number
  content?: string  // Extracted text content
  analysis?: {
    documentType: "policy" | "procedure" | "record" | "report" | "other"
    standard?: "ISO 21001" | "ISO 9001" | "NAQAAE" | null
    clauses?: string[]
    summary?: string
    keywords?: string[]
    confidence: number
  }
  uploadedAt: number
  source: "chat" | "evidence" | "direct"
}

export interface EvidenceItem {
  id: string
  title: string
  type: string
  status: "pending" | "complete" | "missing"
  linkedCriteria?: string[]
  files?: string[]  // References to AnalyzedFile IDs
  aiSummary?: string
  aiTags?: string[]
}

export interface GapAssessment {
  id: string
  clause: string
  description: string
  status: "open" | "addressed" | "partial"
  severity: "critical" | "high" | "medium" | "low"
  evidenceIds?: string[]
  suggestedFiles?: string[]  // AnalyzedFile IDs that might address this
}

export interface ComplianceMetrics {
  evidenceCompleteness: number  // 0-100
  gapResolutionRate: number     // 0-100
  iso21001Progress: number      // 0-100
  naqaaeProgress: number        // 0-100
  totalDocuments: number
  pendingActions: number
}

export interface HorusInsight {
  id: string
  type: "suggestion" | "alert" | "completion" | "gap"
  title: string
  description: string
  relatedModules: string[]
  suggestedActions?: {
    label: string
    module: string
    action: () => void
  }[]
  createdAt: number
}

export interface HorusRecommendation {
  id: string
  type: "file_to_evidence" | "file_to_gap" | "link_documents" | "complete_criteria"
  priority: "high" | "medium" | "low"
  description: string
  sourceFiles?: string[]
  targetModule: string
  autoActionPossible?: boolean
}

export interface PlatformModule {
  id: string
  name: string
  icon?: string
  status: "active" | "inactive" | "beta"
  
  // What this module provides
  getData: () => Promise<Record<string, unknown>>
  getActions: () => Promise<ModuleAction[]>
  
  // Event handlers
  onInsight?: (insight: HorusInsight) => void
  onRecommendation?: (rec: HorusRecommendation) => void
  onFileAnalyzed?: (file: AnalyzedFile) => void
}

export interface ModuleAction {
  id: string
  label: string
  description?: string
  icon?: string
  handler: () => void | Promise<void>
}

export interface HorusState {
  // Intelligence Artifacts
  files: AnalyzedFile[]
  evidence: EvidenceItem[]
  gaps: GapAssessment[]
  metrics: ComplianceMetrics
  
  // Reasoning Outputs
  insights: HorusInsight[]
  recommendations: HorusRecommendation[]
  
  // Module System
  modules: Map<string, PlatformModule>
  
  // Session
  lastActivity: number
  activeContext?: string  // Current module context
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIONS
// ═══════════════════════════════════════════════════════════════════════════════

type HorusAction =
  | { type: "REGISTER_MODULE"; payload: PlatformModule }
  | { type: "UNREGISTER_MODULE"; payload: string }
  | { type: "ADD_FILE"; payload: AnalyzedFile }
  | { type: "UPDATE_FILE"; payload: { id: string; updates: Partial<AnalyzedFile> } }
  | { type: "REMOVE_FILE"; payload: string }
  | { type: "ADD_EVIDENCE"; payload: EvidenceItem }
  | { type: "UPDATE_EVIDENCE"; payload: { id: string; updates: Partial<EvidenceItem> } }
  | { type: "ADD_GAP"; payload: GapAssessment }
  | { type: "UPDATE_GAP"; payload: { id: string; updates: Partial<GapAssessment> } }
  | { type: "ADD_INSIGHT"; payload: HorusInsight }
  | { type: "ADD_RECOMMENDATION"; payload: HorusRecommendation }
  | { type: "MARK_RECOMMENDATION_DONE"; payload: string }
  | { type: "UPDATE_METRICS"; payload: Partial<ComplianceMetrics> }
  | { type: "SET_ACTIVE_CONTEXT"; payload: string }
  | { type: "CLEAR_INSIGHTS" }

// ═══════════════════════════════════════════════════════════════════════════════
// REDUCER
// ═══════════════════════════════════════════════════════════════════════════════

const initialState: HorusState = {
  files: [],
  evidence: [],
  gaps: [],
  metrics: {
    evidenceCompleteness: 0,
    gapResolutionRate: 0,
    iso21001Progress: 0,
    naqaaeProgress: 0,
    totalDocuments: 0,
    pendingActions: 0,
  },
  insights: [],
  recommendations: [],
  modules: new Map(),
  lastActivity: Date.now(),
}

function horusReducer(state: HorusState, action: HorusAction): HorusState {
  switch (action.type) {
    case "REGISTER_MODULE":
      return {
        ...state,
        modules: new Map(state.modules).set(action.payload.id, action.payload),
        lastActivity: Date.now(),
      }
    
    case "UNREGISTER_MODULE":
      const newModules = new Map(state.modules)
      newModules.delete(action.payload)
      return { ...state, modules: newModules, lastActivity: Date.now() }
    
    case "ADD_FILE":
      return {
        ...state,
        files: [...state.files, action.payload],
        lastActivity: Date.now(),
      }
    
    case "UPDATE_FILE":
      return {
        ...state,
        files: state.files.map((f) =>
          f.id === action.payload.id ? { ...f, ...action.payload.updates } : f
        ),
        lastActivity: Date.now(),
      }
    
    case "REMOVE_FILE":
      return {
        ...state,
        files: state.files.filter((f) => f.id !== action.payload),
        lastActivity: Date.now(),
      }
    
    case "ADD_EVIDENCE":
      return {
        ...state,
        evidence: [...state.evidence, action.payload],
        lastActivity: Date.now(),
      }
    
    case "UPDATE_EVIDENCE":
      return {
        ...state,
        evidence: state.evidence.map((e) =>
          e.id === action.payload.id ? { ...e, ...action.payload.updates } : e
        ),
        lastActivity: Date.now(),
      }
    
    case "ADD_GAP":
      return {
        ...state,
        gaps: [...state.gaps, action.payload],
        lastActivity: Date.now(),
      }
    
    case "UPDATE_GAP":
      return {
        ...state,
        gaps: state.gaps.map((g) =>
          g.id === action.payload.id ? { ...g, ...action.payload.updates } : g
        ),
        lastActivity: Date.now(),
      }
    
    case "ADD_INSIGHT":
      return {
        ...state,
        insights: [action.payload, ...state.insights].slice(0, 50), // Keep last 50
        lastActivity: Date.now(),
      }
    
    case "ADD_RECOMMENDATION":
      return {
        ...state,
        recommendations: [action.payload, ...state.recommendations].slice(0, 20),
        lastActivity: Date.now(),
      }
    
    case "MARK_RECOMMENDATION_DONE":
      return {
        ...state,
        recommendations: state.recommendations.filter((r) => r.id !== action.payload),
        lastActivity: Date.now(),
      }
    
    case "UPDATE_METRICS":
      return {
        ...state,
        metrics: { ...state.metrics, ...action.payload },
        lastActivity: Date.now(),
      }
    
    case "SET_ACTIVE_CONTEXT":
      return {
        ...state,
        activeContext: action.payload,
        lastActivity: Date.now(),
      }
    
    case "CLEAR_INSIGHTS":
      return { ...state, insights: [], lastActivity: Date.now() }
    
    default:
      return state
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════

interface HorusContextType {
  state: HorusState
  dispatch: React.Dispatch<HorusAction>
  
  // Module Operations
  registerModule: (module: PlatformModule) => void
  unregisterModule: (moduleId: string) => void
  getModule: (moduleId: string) => PlatformModule | undefined
  
  // File Operations
  addFile: (file: Omit<AnalyzedFile, "id" | "uploadedAt">) => string
  analyzeFile: (fileId: string, analysis: AnalyzedFile["analysis"]) => void
  removeFile: (fileId: string) => void
  getFile: (fileId: string) => AnalyzedFile | undefined
  
  // Cross-Module Intelligence
  findRelatedFiles: (criteria: string[]) => AnalyzedFile[]
  findFilesForGap: (gapId: string) => AnalyzedFile[]
  suggestEvidenceFromFiles: (fileIds: string[]) => EvidenceItem[]
  
  // Insights & Recommendations
  addInsight: (insight: Omit<HorusInsight, "id" | "createdAt">) => void
  addRecommendation: (rec: Omit<HorusRecommendation, "id">) => void
  completeRecommendation: (recId: string) => void
  
  // Metrics
  updateMetrics: (metrics: Partial<ComplianceMetrics>) => void
  calculateCompleteness: () => number
  
  // Context
  setActiveContext: (context: string) => void
  getContextSummary: () => string
}

const HorusBrainContext = createContext<HorusContextType | null>(null)

// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════════════════════════

export function HorusBrainProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(horusReducer, initialState)

  // Module Operations
  const registerModule = useCallback((module: PlatformModule) => {
    dispatch({ type: "REGISTER_MODULE", payload: module })
  }, [])

  const unregisterModule = useCallback((moduleId: string) => {
    dispatch({ type: "UNREGISTER_MODULE", payload: moduleId })
  }, [])

  const getModule = useCallback((moduleId: string) => {
    return state.modules.get(moduleId)
  }, [state.modules])

  // File Operations
  const addFile = useCallback((file: Omit<AnalyzedFile, "id" | "uploadedAt">) => {
    const id = crypto.randomUUID()
    const newFile: AnalyzedFile = {
      ...file,
      id,
      uploadedAt: Date.now(),
    }
    dispatch({ type: "ADD_FILE", payload: newFile })
    
    // Notify all modules about new file
    state.modules.forEach((module) => {
      module.onFileAnalyzed?.(newFile)
    })
    
    return id
  }, [state.modules])

  const analyzeFile = useCallback((fileId: string, analysis: AnalyzedFile["analysis"]) => {
    dispatch({
      type: "UPDATE_FILE",
      payload: { id: fileId, updates: { analysis } },
    })
    
    // Cross-module intelligence: check if this file addresses any gaps
    const file = state.files.find((f) => f.id === fileId)
    if (file && analysis?.clauses) {
      state.gaps.forEach((gap) => {
        if (analysis.clauses?.some((c) => gap.clause.includes(c))) {
          dispatch({
            type: "UPDATE_GAP",
            payload: {
              id: gap.id,
              updates: { suggestedFiles: [...(gap.suggestedFiles || []), fileId] },
            },
          })
        }
      })
    }
  }, [state.files, state.gaps])

  const removeFile = useCallback((fileId: string) => {
    dispatch({ type: "REMOVE_FILE", payload: fileId })
  }, [])

  const getFile = useCallback((fileId: string) => {
    return state.files.find((f) => f.id === fileId)
  }, [state.files])

  // Cross-Module Intelligence
  const findRelatedFiles = useCallback((criteria: string[]) => {
    return state.files.filter((file) =>
      file.analysis?.clauses?.some((clause) =>
        criteria.some((c) => clause.includes(c))
      )
    )
  }, [state.files])

  const findFilesForGap = useCallback((gapId: string) => {
    const gap = state.gaps.find((g) => g.id === gapId)
    if (!gap?.suggestedFiles) return []
    return state.files.filter((f) => gap.suggestedFiles?.includes(f.id))
  }, [state.files, state.gaps])

  const suggestEvidenceFromFiles = useCallback((fileIds: string[]) => {
    return fileIds
      .map((id) => state.files.find((f) => f.id === id))
      .filter(Boolean)
      .map((file) => ({
        id: crypto.randomUUID(),
        title: file!.name,
        type: file!.analysis?.documentType || "other",
        status: "pending" as const,
        linkedCriteria: file!.analysis?.clauses || [],
        files: [file!.id],
        aiSummary: file!.analysis?.summary,
        aiTags: file!.analysis?.keywords,
      }))
  }, [state.files])

  // Insights & Recommendations
  const addInsight = useCallback((insight: Omit<HorusInsight, "id" | "createdAt">) => {
    const newInsight: HorusInsight = {
      ...insight,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    }
    dispatch({ type: "ADD_INSIGHT", payload: newInsight })
    
    // Notify relevant modules
    insight.relatedModules.forEach((moduleId) => {
      const module = state.modules.get(moduleId)
      module?.onInsight?.(newInsight)
    })
  }, [state.modules])

  const addRecommendation = useCallback((rec: Omit<HorusRecommendation, "id">) => {
    const newRec: HorusRecommendation = {
      ...rec,
      id: crypto.randomUUID(),
    }
    dispatch({ type: "ADD_RECOMMENDATION", payload: newRec })
    
    const module = state.modules.get(rec.targetModule)
    module?.onRecommendation?.(newRec)
  }, [state.modules])

  const completeRecommendation = useCallback((recId: string) => {
    dispatch({ type: "MARK_RECOMMENDATION_DONE", payload: recId })
  }, [])

  // Metrics
  const updateMetrics = useCallback((metrics: Partial<ComplianceMetrics>) => {
    dispatch({ type: "UPDATE_METRICS", payload: metrics })
  }, [])

  const calculateCompleteness = useCallback(() => {
    if (state.evidence.length === 0) return 0
    const complete = state.evidence.filter((e) => e.status === "complete").length
    return Math.round((complete / state.evidence.length) * 100)
  }, [state.evidence])

  // Context
  const setActiveContext = useCallback((context: string) => {
    dispatch({ type: "SET_ACTIVE_CONTEXT", payload: context })
  }, [])

  const getContextSummary = useCallback(() => {
    return `
Platform Context:
- Files analyzed: ${state.files.length}
- Evidence items: ${state.evidence.length} (${state.evidence.filter(e => e.status === "complete").length} complete)
- Open gaps: ${state.gaps.filter(g => g.status === "open").length}
- Active modules: ${state.modules.size}
- Pending insights: ${state.insights.length}
- Recommendations: ${state.recommendations.length}
    `.trim()
  }, [state])

  const value: HorusContextType = {
    state,
    dispatch,
    registerModule,
    unregisterModule,
    getModule,
    addFile,
    analyzeFile,
    removeFile,
    getFile,
    findRelatedFiles,
    findFilesForGap,
    suggestEvidenceFromFiles,
    addInsight,
    addRecommendation,
    completeRecommendation,
    updateMetrics,
    calculateCompleteness,
    setActiveContext,
    getContextSummary,
  }

  return (
    <HorusBrainContext.Provider value={value}>
      {children}
    </HorusBrainContext.Provider>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export function useHorusBrain() {
  const context = useContext(HorusBrainContext)
  if (!context) {
    throw new Error("useHorusBrain must be used within HorusBrainProvider")
  }
  return context
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE REGISTRATION HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export function useModuleRegistration(module: PlatformModule) {
  const { registerModule, unregisterModule } = useHorusBrain()
  
  React.useEffect(() => {
    registerModule(module)
    return () => unregisterModule(module.id)
  }, [module, registerModule, unregisterModule])
}
