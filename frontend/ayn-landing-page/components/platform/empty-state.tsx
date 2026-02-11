"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Archive,
  BookOpen,
  Target,
  FileText,
  Upload,
  Plus,
  Lightbulb,
  Sparkles,
} from "lucide-react"

interface EmptyStateProps {
  type: "evidence" | "standards" | "gap-analysis" | "dashboard" | "reports"
  title?: string
  description?: string
}

const emptyStateConfig = {
  evidence: {
    icon: Archive,
    title: "Evidence Vault is Empty",
    description: "Your institutional evidence library is waiting for its first assets. Upload policies, procedures, and documentation to enable Horus AI compliance analysis.",
    ctaText: "Upload First Evidence",
    ctaHref: "#",
    ctaAction: true,
    tip: "Tip: Uploading your communication policy helps Horus AI identify 20% more compliance gaps automatically.",
    illustration: "evidence",
  },
  standards: {
    icon: BookOpen,
    title: "No Standards Configured",
    description: "Define your compliance frameworks to activate Horus AI monitoring. Import from our library or create custom standards tailored to your institution.",
    ctaText: "Browse Standards Library",
    ctaHref: "/platform/standards",
    ctaAction: false,
    tip: "Tip: Institutions with 3+ mapped standards see 45% faster audit completion times.",
    illustration: "standards",
  },
  "gap-analysis": {
    icon: Target,
    title: "No Gap Analysis History",
    description: "Run your first compliance assessment to establish a baseline. Horus AI will identify vulnerabilities and create a remediation roadmap.",
    ctaText: "Start First Audit",
    ctaHref: "/platform/gap-analysis",
    ctaAction: false,
    tip: "Tip: Running monthly gap analyses reduces compliance drift by up to 60%.",
    illustration: "analysis",
  },
  dashboard: {
    icon: Sparkles,
    title: "Welcome to Ayn",
    description: "Your AI-powered compliance command center is ready. Begin by uploading evidence or importing standards to activate real-time monitoring.",
    ctaText: "Quick Start Guide",
    ctaHref: "#",
    ctaAction: true,
    tip: "Tip: Complete your profile and upload 3 documents to unlock personalized AI recommendations.",
    illustration: "welcome",
  },
  reports: {
    icon: FileText,
    title: "No Reports Generated",
    description: "Generate comprehensive compliance reports once you have evidence and standards mapped. Export to PDF or share with stakeholders.",
    ctaText: "Generate First Report",
    ctaHref: "/platform/standards",
    ctaAction: false,
    tip: "Tip: Schedule monthly auto-reports to keep leadership informed without manual work.",
    illustration: "reports",
  },
}

// SVG Illustrations
function EvidenceIllustration() {
  return (
    <svg viewBox="0 0 200 160" fill="none" className="w-40 h-32 mb-6 opacity-80">
      <rect x="40" y="20" width="120" height="140" rx="8" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" fill="none" />
      <rect x="55" y="45" width="90" height="6" rx="3" fill="currentColor" fillOpacity="0.1" />
      <rect x="55" y="60" width="70" height="6" rx="3" fill="currentColor" fillOpacity="0.1" />
      <rect x="55" y="75" width="80" height="6" rx="3" fill="currentColor" fillOpacity="0.1" />
      <circle cx="140" cy="130" r="25" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" fill="none" />
      <path d="M128 130h24M140 118v24" stroke="currentColor" strokeOpacity="0.4" strokeWidth="3" strokeLinecap="round" />
      <circle cx="55" cy="115" r="15" fill="currentColor" fillOpacity="0.08" />
      <circle cx="85" cy="115" r="12" fill="currentColor" fillOpacity="0.06" />
    </svg>
  )
}

function StandardsIllustration() {
  return (
    <svg viewBox="0 0 200 160" fill="none" className="w-40 h-32 mb-6 opacity-80">
      <rect x="30" y="30" width="55" height="70" rx="6" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" fill="none" />
      <rect x="45" y="50" width="25" height="4" rx="2" fill="currentColor" fillOpacity="0.15" />
      <rect x="45" y="60" width="20" height="4" rx="2" fill="currentColor" fillOpacity="0.1" />
      <rect x="72" y="20" width="55" height="70" rx="6" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" fill="none" />
      <rect x="87" y="40" width="25" height="4" rx="2" fill="currentColor" fillOpacity="0.2" />
      <rect x="87" y="50" width="20" height="4" rx="2" fill="currentColor" fillOpacity="0.15" />
      <rect x="115" y="40" width="55" height="70" rx="6" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" fill="none" />
      <rect x="130" y="60" width="25" height="4" rx="2" fill="currentColor" fillOpacity="0.25" />
      <rect x="130" y="70" width="20" height="4" rx="2" fill="currentColor" fillOpacity="0.2" />
      <circle cx="100" cy="120" r="20" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" fill="none" />
      <path d="M92 120l6 6 12-12" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function AnalysisIllustration() {
  return (
    <svg viewBox="0 0 200 160" fill="none" className="w-40 h-32 mb-6 opacity-80">
      <circle cx="100" cy="80" r="50" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2" fill="none" />
      <circle cx="100" cy="80" r="35" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" fill="none" />
      <circle cx="100" cy="80" r="20" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" fill="none" />
      <circle cx="100" cy="80" r="6" fill="currentColor" fillOpacity="0.3" />
      <path d="M100 30v15M100 115v15M50 80H35M165 80h-15" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
      <circle cx="100" cy="45" r="4" fill="currentColor" fillOpacity="0.3" />
      <circle cx="150" cy="80" r="4" fill="currentColor" fillOpacity="0.3" />
      <circle cx="100" cy="115" r="4" fill="currentColor" fillOpacity="0.3" />
      <circle cx="50" cy="80" r="4" fill="currentColor" fillOpacity="0.3" />
    </svg>
  )
}

function WelcomeIllustration() {
  return (
    <svg viewBox="0 0 200 160" fill="none" className="w-40 h-32 mb-6 opacity-80">
      <rect x="40" y="40" width="120" height="90" rx="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" fill="none" />
      <circle cx="100" cy="85" r="25" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" fill="none" />
      <path d="M90 85l7 7 15-15" stroke="currentColor" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="55" y="55" width="20" height="3" rx="1.5" fill="currentColor" fillOpacity="0.15" />
      <rect x="125" y="110" width="20" height="3" rx="1.5" fill="currentColor" fillOpacity="0.15" />
      <circle cx="60" cy="110" r="8" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" fill="none" />
      <circle cx="140" cy="55" r="8" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" fill="none" />
    </svg>
  )
}

function ReportsIllustration() {
  return (
    <svg viewBox="0 0 200 160" fill="none" className="w-40 h-32 mb-6 opacity-80">
      <rect x="50" y="20" width="100" height="120" rx="8" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" fill="none" />
      <rect x="65" y="40" width="70" height="4" rx="2" fill="currentColor" fillOpacity="0.15" />
      <rect x="65" y="55" width="50" height="4" rx="2" fill="currentColor" fillOpacity="0.1" />
      <rect x="65" y="70" width="60" height="4" rx="2" fill="currentColor" fillOpacity="0.1" />
      <rect x="65" y="85" width="40" height="4" rx="2" fill="currentColor" fillOpacity="0.1" />
      <rect x="65" y="105" width="70" height="20" rx="4" fill="currentColor" fillOpacity="0.08" />
      <circle cx="145" cy="115" r="15" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" fill="none" />
      <path d="M138 115h14M145 108v14" stroke="currentColor" strokeOpacity="0.4" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

const illustrations: Record<string, () => JSX.Element> = {
  evidence: EvidenceIllustration,
  standards: StandardsIllustration,
  analysis: AnalysisIllustration,
  welcome: WelcomeIllustration,
  reports: ReportsIllustration,
}

export function EmptyState({ type, title, description }: EmptyStateProps) {
  const config = emptyStateConfig[type]
  const Icon = config.icon
  const Illustration = illustrations[config.illustration]

  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 px-8 text-center">
      {/* Illustration */}
      <div className="text-zinc-400">
        <Illustration />
      </div>

      {/* Icon Badge */}
      <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
        <Icon className="w-8 h-8 text-blue-400" />
      </div>

      {/* Title */}
      <h3 className="text-2xl font-bold text-white mb-3">
        {title || config.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-zinc-400 max-w-md mb-8 leading-relaxed">
        {description || config.description}
      </p>

      {/* CTA Button */}
      {config.ctaAction ? (
        <Button
          size="lg"
          className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-6 text-sm font-bold rounded-xl shadow-xl shadow-blue-600/20 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4 mr-2" />
          {config.ctaText}
        </Button>
      ) : (
        <Link href={config.ctaHref}>
          <Button
            size="lg"
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-6 text-sm font-bold rounded-xl shadow-xl shadow-blue-600/20 transition-all hover:scale-105 active:scale-95"
          >
            <Upload className="w-4 h-4 mr-2" />
            {config.ctaText}
          </Button>
        </Link>
      )}

      {/* Pro Tip */}
      <div className="mt-8 flex items-start gap-3 max-w-sm p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
        <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-200/80 leading-relaxed">
          {config.tip}
        </p>
      </div>
    </div>
  )
}

export function InlineEmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
}: { 
  icon: React.ElementType
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="glass-panel rounded-[32px] p-12 border-white/5 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mx-auto mb-5">
        <Icon className="w-6 h-6 text-zinc-500" />
      </div>
      <h4 className="text-lg font-bold text-white mb-2">{title}</h4>
      <p className="text-sm text-zinc-500 max-w-sm mx-auto mb-6">{description}</p>
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  )
}
