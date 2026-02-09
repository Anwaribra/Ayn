// HORUS AI - Central Intelligence Exports
// 
// This is the main entry point for all Horus AI functionality.
// Horus is the shared intelligence layer across all platform modules.

export {
  // Core Context
  HorusBrainProvider,
  useHorusBrain,
  useModuleRegistration,
  
  // Types
  type AnalyzedFile,
  type EvidenceItem,
  type GapAssessment,
  type ComplianceMetrics,
  type HorusInsight,
  type HorusRecommendation,
  type PlatformModule,
  type ModuleAction,
  type HorusState,
} from "./horus-brain-context"

export {
  // Chat Service
  HorusChatService,
  useHorusChat,
  
  // Types
  type ChatMessage,
  type ChatAction,
} from "./horus-chat-service"
