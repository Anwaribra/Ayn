import {
  LayoutDashboard,
  FileText,
  Search,
  BarChart3,
  Archive,
  Bot,
  Bell,
  Settings,
  Plus,
  Upload,
  Sparkles,
  User,
  LogOut,
  Moon,
  Sun,
  HelpCircle,
  BookOpen,
  ClipboardList,
  Target,
  Zap,
  MessageSquare,
  FileCheck,
  GraduationCap,
  Scale,
  Lightbulb,
  type LucideIcon,
} from "lucide-react"

export type CommandCategory =
  | "Navigation"
  | "AI & Assistance"
  | "Actions"
  | "Quick Create"
  | "Preferences"
  | "Help"

export interface Command {
  id: string
  title: string
  description?: string
  icon: LucideIcon
  category: CommandCategory
  href?: string
  shortcut?: string
  action?: () => void
  keywords?: string[]
  badge?: "AI" | "New" | "Beta"
}

export const navigationCommands: Command[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    description: "View your quality assurance overview",
    icon: LayoutDashboard,
    category: "Navigation",
    href: "/platform/dashboard",
    keywords: ["home", "overview", "stats", "metrics"],
  },
  {
    id: "assessments",
    title: "Assessments",
    description: "Manage quality assessments",
    icon: BarChart3,
    category: "Navigation",
    href: "/platform/assessments",
    keywords: ["reviews", "evaluations", "audits", "inspections"],
  },
  {
    id: "evidence",
    title: "Evidence",
    description: "Manage evidence and documentation",
    icon: FileText,
    category: "Navigation",
    href: "/platform/evidence",
    keywords: ["documents", "files", "proof", "uploads"],
  },
  {
    id: "gap-analysis",
    title: "Gap Analysis",
    description: "AI-powered compliance analysis",
    icon: Search,
    category: "Navigation",
    href: "/platform/gap-analysis",
    keywords: ["compliance", "gaps", "analysis", "check"],
    badge: "AI",
  },
  {
    id: "standards",
    title: "Standards",
    description: "Browse ISO and accreditation standards",
    icon: BookOpen,
    category: "Navigation",
    href: "/platform/standards",
    keywords: ["iso", "naqaae", "requirements", "criteria"],
  },
  {
    id: "archive",
    title: "Accreditation Archive",
    description: "Historical accreditation data",
    icon: Archive,
    category: "Navigation",
    href: "/platform/archive",
    keywords: ["history", "past", "records", "previous"],
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "View your notifications",
    icon: Bell,
    category: "Navigation",
    href: "/platform/notifications",
    keywords: ["alerts", "updates", "messages"],
  },
  {
    id: "settings",
    title: "Settings",
    description: "Manage your account and preferences",
    icon: Settings,
    category: "Navigation",
    href: "/platform/settings",
    keywords: ["preferences", "account", "profile", "config"],
  },
]

export const aiCommands: Command[] = [
  {
    id: "horus-ai",
    title: "Chat with Horus AI",
    description: "Your AI quality assurance advisor",
    icon: Bot,
    category: "AI & Assistance",
    href: "/platform/horus-ai",
    shortcut: "⌘H",
    keywords: ["chat", "assistant", "help", "advice", "ask"],
    badge: "AI",
  },
  {
    id: "ai-analyze",
    title: "Analyze Document",
    description: "Get AI analysis on uploaded documents",
    icon: Sparkles,
    category: "AI & Assistance",
    href: "/platform/horus-ai",
    keywords: ["review", "check", "analyze", "document"],
    badge: "AI",
  },
  {
    id: "ai-iso-explain",
    title: "Explain ISO 21001",
    description: "Get detailed explanation of ISO standards",
    icon: FileCheck,
    category: "AI & Assistance",
    href: "/platform/horus-ai",
    action: () => {
      // Set initial message in localStorage for the chat to pick up
      localStorage.setItem(
        "horus-ai-initial-prompt",
        "Explain the key requirements of ISO 21001 clause by clause"
      )
    },
    keywords: ["iso", "standards", "explain", "21001", "requirements"],
    badge: "AI",
  },
  {
    id: "ai-naqaae-guide",
    title: "NAQAAE Self-Assessment Guide",
    description: "Step-by-step guidance for NAQAAE",
    icon: GraduationCap,
    category: "AI & Assistance",
    href: "/platform/horus-ai",
    action: () => {
      localStorage.setItem(
        "horus-ai-initial-prompt",
        "Guide me through the NAQAAE self-assessment process"
      )
    },
    keywords: ["naqaae", "egypt", "assessment", "guide", "domains"],
    badge: "AI",
  },
  {
    id: "ai-gap-check",
    title: "Check for Common Gaps",
    description: "Identify typical compliance gaps",
    icon: Scale,
    category: "AI & Assistance",
    href: "/platform/horus-ai",
    action: () => {
      localStorage.setItem(
        "horus-ai-initial-prompt",
        "What are the most common gaps educational institutions face for ISO 21001 certification?"
      )
    },
    keywords: ["gaps", "common", "issues", "problems", "mistakes"],
    badge: "AI",
  },
  {
    id: "ai-evidence-help",
    title: "Evidence Collection Help",
    description: "What evidence should you collect?",
    icon: Lightbulb,
    category: "AI & Assistance",
    href: "/platform/horus-ai",
    action: () => {
      localStorage.setItem(
        "horus-ai-initial-prompt",
        "What types of evidence should I collect for accreditation and how should they be organized?"
      )
    },
    keywords: ["evidence", "documents", "collect", "organize"],
    badge: "AI",
  },
]

export const actionCommands: Command[] = [
  {
    id: "new-assessment",
    title: "New Assessment",
    description: "Create a new quality assessment",
    icon: Plus,
    category: "Quick Create",
    href: "/platform/assessments/new",
    shortcut: "⌘⇧A",
    keywords: ["create", "start", "begin", "assessment", "evaluation"],
  },
  {
    id: "upload-evidence",
    title: "Upload Evidence",
    description: "Upload new documentation",
    icon: Upload,
    category: "Quick Create",
    href: "/platform/evidence/upload",
    shortcut: "⌘⇧U",
    keywords: ["upload", "file", "document", "add", "attach"],
  },
  {
    id: "run-gap-analysis",
    title: "Run Gap Analysis",
    description: "Analyze compliance gaps",
    icon: Target,
    category: "Actions",
    href: "/platform/gap-analysis",
    keywords: ["analyze", "check", "compliance", "gaps"],
    badge: "AI",
  },
  {
    id: "view-reports",
    title: "View Reports",
    description: "Access analytics and reports",
    icon: ClipboardList,
    category: "Actions",
    href: "/platform/analytics",
    keywords: ["reports", "analytics", "data", "insights"],
  },
  {
    id: "automation",
    title: "Automation Workflows",
    description: "Manage automated processes",
    icon: Zap,
    category: "Actions",
    href: "/platform/workflows",
    keywords: ["automate", "workflow", "process", "tasks"],
    badge: "Beta",
  },
]

export const preferenceCommands: Command[] = [
  {
    id: "toggle-theme",
    title: "Toggle Theme",
    description: "Switch between light and dark mode",
    icon: Sun,
    category: "Preferences",
    shortcut: "⌘⇧T",
    action: () => {
      const html = document.documentElement
      const current = html.classList.contains("dark") ? "dark" : "light"
      const next = current === "dark" ? "light" : "dark"
      html.classList.remove(current)
      html.classList.add(next)
      localStorage.setItem("theme", next)
    },
    keywords: ["theme", "dark", "light", "mode", "appearance"],
  },
  {
    id: "profile",
    title: "My Profile",
    description: "View and edit your profile",
    icon: User,
    category: "Preferences",
    href: "/platform/settings/profile",
    keywords: ["profile", "account", "user", "personal"],
  },
  {
    id: "logout",
    title: "Log Out",
    description: "Sign out of your account",
    icon: LogOut,
    category: "Preferences",
    action: () => {
      // Trigger logout via auth context or direct API call
      window.dispatchEvent(new CustomEvent("logout-requested"))
    },
    keywords: ["logout", "signout", "exit", "leave"],
  },
]

export const helpCommands: Command[] = [
  {
    id: "help-center",
    title: "Help Center",
    description: "Browse documentation and guides",
    icon: HelpCircle,
    category: "Help",
    href: "/help",
    keywords: ["help", "docs", "documentation", "guide"],
  },
  {
    id: "contact-support",
    title: "Contact Support",
    description: "Get help from our team",
    icon: MessageSquare,
    category: "Help",
    href: "/support",
    keywords: ["support", "contact", "help", "assist"],
  },
  {
    id: "keyboard-shortcuts",
    title: "Keyboard Shortcuts",
    description: "View all available shortcuts",
    icon: Zap,
    category: "Help",
    shortcut: "?",
    keywords: ["shortcuts", "keyboard", "hotkeys", "commands"],
  },
]

export const allCommands: Command[] = [
  ...navigationCommands,
  ...aiCommands,
  ...actionCommands,
  ...preferenceCommands,
  ...helpCommands,
]

// Group commands by category for display
export const groupCommandsByCategory = (
  commands: Command[]
): Record<string, Command[]> => {
  return commands.reduce((acc, command) => {
    if (!acc[command.category]) {
      acc[command.category] = []
    }
    acc[command.category].push(command)
    return acc
  }, {} as Record<string, Command[]>)
}

// Search/filter commands
export const filterCommands = (
  commands: Command[],
  query: string
): Command[] => {
  const normalizedQuery = query.toLowerCase().trim()
  if (!normalizedQuery) return commands

  return commands.filter((cmd) => {
    const titleMatch = cmd.title.toLowerCase().includes(normalizedQuery)
    const descMatch = cmd.description
      ?.toLowerCase()
      .includes(normalizedQuery)
    const keywordMatch = cmd.keywords?.some((k) =>
      k.toLowerCase().includes(normalizedQuery)
    )
    return titleMatch || descMatch || keywordMatch
  })
}

// Get recent commands from localStorage
export const getRecentCommands = (): string[] => {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem("ayn-recent-commands")
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Save command to recent
export const saveRecentCommand = (commandId: string) => {
  if (typeof window === "undefined") return
  try {
    const recent = getRecentCommands()
    const updated = [
      commandId,
      ...recent.filter((id) => id !== commandId),
    ].slice(0, 5)
    localStorage.setItem("ayn-recent-commands", JSON.stringify(updated))
  } catch {
    // Ignore storage errors
  }
}
