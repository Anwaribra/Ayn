// HORUS AI - Central Operating System
// 
// NOT a chatbot. NOT an assistant.
// Read-only intelligence layer.

export {
  HorusBrainProvider,
  useHorusBrain,
  type PlatformFile,
  type EvidenceItem,
  type GapItem,
  type DashboardMetric,
  type PlatformState,
  type PlatformEvent,
  type StateSummary,
} from "./horus-brain-context"

export {
  useHorusObserver,
  useFileUploadHandler,
  type HorusObservation,
} from "./horus-chat-service"
