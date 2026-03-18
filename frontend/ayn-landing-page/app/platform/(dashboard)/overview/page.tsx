"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { 
  BarChart3, FileText, Target, Brain, ArrowRight, 
  Upload, TrendingUp, AlertTriangle, Clock, Sparkles 
} from "lucide-react"

export default function OverviewPage() {
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getDashboardMetrics().then(setMetrics).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 w-48 bg-[var(--surface)] rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-[var(--surface)] rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-48 bg-[var(--surface)] rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const score = metrics?.complianceScore ?? 0
  const evidence = metrics?.totalEvidence ?? 0
  const gaps = metrics?.activeAlerts ?? 0
  const analyses = metrics?.totalAnalyses ?? 0

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Overview</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Your compliance command center at a glance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/platform/gap-analysis" className="group p-5 rounded-2xl glass-panel glass-border hover:border-blue-500/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <ArrowRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-blue-500 transition-colors" />
          </div>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{score}%</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Compliance Score</p>
        </Link>

        <Link href="/platform/evidence" className="group p-5 rounded-2xl glass-panel glass-border hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-500" />
            </div>
            <ArrowRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-emerald-500 transition-colors" />
          </div>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{evidence}</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Evidence Documents</p>
        </Link>

        <Link href="/platform/gap-analysis" className="group p-5 rounded-2xl glass-panel glass-border hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <ArrowRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-amber-500 transition-colors" />
          </div>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{gaps}</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Active Gaps</p>
        </Link>

        <Link href="/platform/analytics" className="group p-5 rounded-2xl glass-panel glass-border hover:border-purple-500/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-500" />
            </div>
            <ArrowRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-purple-500 transition-colors" />
          </div>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{analyses}</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Total Analyses</p>
        </Link>
      </div>

      {/* Quick Actions + Horus */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-6 rounded-2xl glass-panel glass-border">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-500" /> Quick Actions
          </h2>
          <div className="space-y-2">
            <Link href="/platform/evidence/upload" className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--surface-hover)] transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center"><Upload className="w-4 h-4 text-emerald-500" /></div>
              <div className="flex-1"><p className="text-sm font-medium text-[var(--text-primary)]">Upload Evidence</p><p className="text-xs text-[var(--text-tertiary)]">Add documents for AI analysis</p></div>
              <ArrowRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/platform/gap-analysis" className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--surface-hover)] transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center"><Target className="w-4 h-4 text-amber-500" /></div>
              <div className="flex-1"><p className="text-sm font-medium text-[var(--text-primary)]">Run Gap Analysis</p><p className="text-xs text-[var(--text-tertiary)]">Assess compliance readiness</p></div>
              <ArrowRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/platform/horus-ai" className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--surface-hover)] transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center"><Brain className="w-4 h-4 text-blue-500" /></div>
              <div className="flex-1"><p className="text-sm font-medium text-[var(--text-primary)]">Ask Horus AI</p><p className="text-xs text-[var(--text-tertiary)]">Get instant compliance guidance</p></div>
              <ArrowRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/platform/ai-tools" className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--surface-hover)] transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center"><Clock className="w-4 h-4 text-purple-500" /></div>
              <div className="flex-1"><p className="text-sm font-medium text-[var(--text-primary)]">AI Tools</p><p className="text-xs text-[var(--text-tertiary)]">Remediation, audit prep & more</p></div>
              <ArrowRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        <Link href="/platform/horus-ai" className="group p-6 rounded-2xl glass-readable border border-blue-500/20 hover:border-blue-500/40 transition-all flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-blue-400" />
            </div>
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">Horus AI</h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Your AI compliance assistant. Ask questions, analyze evidence, run audits, and get real-time remediation guidance.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-2 text-blue-400 text-sm font-medium">
            Start conversation <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  )
}
