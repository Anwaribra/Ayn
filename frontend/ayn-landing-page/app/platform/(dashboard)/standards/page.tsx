"use client"

import { useState, useMemo } from "react"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import useSWR from "swr"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Book,
  Shield,
  ArrowUpRight,
  Target,
  Layers,
  Activity,
  Play,
  Plus,
  Sparkles,
} from "lucide-react"
import type { Standard, GapAnalysisListItem } from "@/types"
import { EmptyState } from "@/components/platform/empty-state"
import { StandardsGridSkeleton } from "@/components/platform/skeleton-loader"
import { StandardsTemplatesButton, Template } from "@/components/platform/standards-templates"
import { WorkflowTimeline } from "@/components/platform/standards/workflow-timeline"

export default function StandardsPage() {
  return (
    <ProtectedRoute>
      <StandardsContent />
    </ProtectedRoute>
  )
}

const CARD_COLORS = ["bg-blue-600/10", "bg-emerald-600/10", "bg-amber-600/10", "bg-indigo-600/10", "bg-rose-600/10", "bg-cyan-600/10"]
const CARD_ICONS = [Shield, Target, Layers, Activity, Book, Shield]

function StandardsContent() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<"database" | "mapping">("database")

  const { data: standards, isLoading } = useSWR<Standard[]>(
    user ? "standards" : null,
    () => api.getStandards(),
  )
  const { data: gapAnalyses } = useSWR<GapAnalysisListItem[]>(
    user ? "gap-analyses" : null,
    () => api.getGapAnalyses(),
  )
  const { data: evidence } = useSWR(
    user ? "evidence" : null,
    () => api.getEvidence(),
  )

  const collections = (standards ?? []).map((s: Standard, i: number) => {
    const report = (gapAnalyses ?? []).find((g) => g.standardTitle === s.title)
    const equilibrium = report ? Math.round(report.overallScore) : 0
    return {
      id: s.id,
      title: s.title,
      code: s.id.slice(0, 8).toUpperCase(),
      color: CARD_COLORS[i % CARD_COLORS.length],
      equilibrium,
    }
  })

  // Determine current lifecycle step based on data
  const lifecycleStep = useMemo(() => {
    if (!standards || standards.length === 0) return 0 // Definition
    if (!gapAnalyses || gapAnalyses.length === 0) return 1 // Analysis
    if (!evidence || evidence.length === 0) return 2 // Evidence
    return 3 // Audit Ready
  }, [standards, gapAnalyses, evidence])

  const steps = [
    { id: "1", label: "Framework Definition", status: lifecycleStep > 0 ? "completed" : "current", date: "System Config" },
    { id: "2", label: "Gap Analysis", status: lifecycleStep > 1 ? "completed" : lifecycleStep === 1 ? "current" : "pending" },
    { id: "3", label: "Evidence Mapping", status: lifecycleStep > 2 ? "completed" : lifecycleStep === 2 ? "current" : "pending" },
    { id: "4", label: "Audit Readiness", status: lifecycleStep > 3 ? "completed" : lifecycleStep === 3 ? "current" : "pending" },
  ] as any

  const getStandardStatus = (stdId: string) => {
    const std = (standards ?? []).find((s) => s.id === stdId)
    if (!std) return null
    const report = (gapAnalyses ?? []).find((g) => g.standardTitle === std.title)
    if (!report) return null
    return report.overallScore >= 80 ? "OPTIMAL" : "WARNING"
  }

  const evidenceCountByStandard = useMemo(() => {
    const map: Record<string, number> = {}
      ; (evidence ?? []).forEach((e: { criterionId: string | null; criterion?: { standardId: string } }) => {
        if (e.criterionId && e.criterion?.standardId) {
          map[e.criterion.standardId] = (map[e.criterion.standardId] ?? 0) + 1
        }
      })
    return map
  }, [evidence])

  return (
    <div className="animate-fade-in-up pb-20 space-y-8">
      <header className="pt-6 px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => setActiveTab("database")}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === "database"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                  : "bg-white text-zinc-500 hover:bg-zinc-100 dark:bg-slate-900 dark:text-zinc-400 dark:hover:bg-slate-800"}`}
              >
                Regulatory Database
              </button>
              <button
                onClick={() => setActiveTab("mapping")}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === "mapping"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                  : "bg-white text-zinc-500 hover:bg-zinc-100 dark:bg-slate-900 dark:text-zinc-400 dark:hover:bg-slate-800"}`}
              >
                Compliance Mapping
              </button>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
              Standards <span className="text-zinc-400 font-light dark:text-zinc-500">Hub</span>
            </h1>
            <p className="text-zinc-500 font-medium dark:text-zinc-400">Manage and map your institutional compliance frameworks.</p>
          </div>

          <div className="w-full md:w-1/2 lg:w-1/3">
            <WorkflowTimeline steps={steps} />
          </div>
        </div>
      </header>

      {/* Grid Collections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
        {isLoading ? (
          <StandardsGridSkeleton count={4} />
        ) : collections.length === 0 ? (
          <div className="col-span-full">
            <EmptyState type="standards" />
            <div className="flex justify-center gap-4 mt-8">
              <StandardsTemplatesButton onSelect={(template: Template) => {
                // Handle template selection - redirect to create page with template data
                window.location.href = `/platform/standards/new?template=${template.id}`
              }} />
              <Link href="/platform/standards/new">
                <Button className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Custom
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          collections.map((c, i) => (
            <Link
              key={c.id}
              href={`/platform/standards/${c.id}`}
              className="group glass-panel rounded-[32px] p-6 border-zinc-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[220px] animate-fade-in-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex justify-between items-start">
                <div className={`w-12 h-12 rounded-2xl ${c.color} border border-white/50 flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm`}>
                  {(() => { const Icon = CARD_ICONS[i % CARD_ICONS.length]; return <Icon className="w-6 h-6 text-zinc-700/80 group-hover:text-zinc-900 transition-colors" /> })()}
                </div>
                <div className="w-8 h-8 rounded-full bg-white border border-zinc-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all -translate-y-2 group-hover:translate-y-0">
                  <ArrowUpRight className="w-4 h-4 text-zinc-900" />
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">{c.code}</span>
                <h3 className="text-xl font-bold text-zinc-900 mb-4 leading-tight group-hover:text-blue-600 transition-colors">{c.title}</h3>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    <span>Alignment Score</span>
                    <span className={c.equilibrium >= 80 ? "text-emerald-500" : "text-amber-500"}>{c.equilibrium}%</span>
                  </div>
                  <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-1000 ${c.equilibrium >= 80 ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${c.equilibrium ?? 0}%` }} />
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Framework Topology Explorer */}
      <section className="px-4 pt-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black italic text-zinc-900">Framework Topology</h2>
            <div className="h-px w-16 bg-zinc-200" />
          </div>
          <Link href="/platform/gap-analysis" className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1">
            Run Alignment Analysis <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {(standards ?? []).slice(0, 4).map((std: Standard, i: number) => {
              const Icon = CARD_ICONS[i % CARD_ICONS.length]
              const report = (gapAnalyses ?? []).find((g) => g.standardTitle === std.title)
              const status = getStandardStatus(std.id)
              const evidenceNodes = evidenceCountByStandard[std.id] ?? 0
              return (
                <Link
                  key={std.id}
                  href={`/platform/standards/${std.id}`}
                  className="glass-panel p-5 rounded-[24px] border-zinc-100 hover:border-blue-200 flex items-center justify-between hover:bg-white hover:shadow-lg hover:shadow-blue-500/5 transition-all group cursor-pointer animate-fade-in-up"
                  style={{ animationDelay: `${(i + 4) * 60}ms` }}
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                      <Icon className="w-5 h-5 text-zinc-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-zinc-900 group-hover:text-blue-700 transition-colors">{std.title}</h4>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                        <span>Last Audit: {report ? new Date(report.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit" }).toUpperCase() : "—"}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-300" />
                        <span>{evidenceNodes} Evidence Assets</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {status && (
                      <span className={`text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full border ${status === "OPTIMAL" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"}`}>
                        {status}
                      </span>
                    )}
                    <button className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-50 text-zinc-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <Play className="w-3 h-3 fill-current" />
                    </button>
                  </div>
                </Link>
              )
            })}

            {(standards ?? []).length === 0 && !isLoading && (
              <div className="col-span-full">
                <div className="glass-panel rounded-3xl p-12 text-center border-dashed border-2 border-zinc-200 bg-zinc-50/50">
                  <Target className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                  <p className="text-zinc-500 font-medium mb-6">No standards available for topology mapping.</p>
                  <StandardsTemplatesButton onSelect={(template: Template) => {
                    window.location.href = `/platform/standards/new?template=${template.id}`
                  }} />
                </div>
              </div>
            )}
          </div>

          <div className="glass-panel rounded-[32px] p-8 bg-zinc-900 text-white flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 rounded-lg bg-white/10">
                  <Shield className="w-5 h-5 text-blue-400" />
                </div>
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Intelligence Summary</h4>
              </div>

              <p className="text-lg font-medium leading-relaxed mb-8 text-zinc-200">
                Current institutional framework contains <span className="text-white font-bold text-2xl">{collections.length}</span> active standards.
                {(() => {
                  const needsReview = (standards ?? []).find((s) => getStandardStatus(s.id) === "WARNING")
                  return needsReview
                    ? <> Horus recommends a compliance review of the <span className="text-amber-400 font-bold border-b border-amber-400/30">{needsReview.title}</span> framework.</>
                    : " All frameworks are within compliance targets."
                })()}
              </p>

              <Link href="/platform/gap-analysis" className="w-full py-4 rounded-2xl bg-white text-zinc-900 font-bold hover:bg-blue-50 transition-all text-center block shadow-lg active:scale-95">
                Generate Compliance Briefing
              </Link>
            </div>

            <div className="mt-auto pt-8 border-t border-white/10 flex items-center gap-4 relative z-10">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Ayn Core Live Sync</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}


