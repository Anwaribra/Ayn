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

const CARD_COLORS = ["bg-[var(--status-info-bg)]", "bg-[var(--status-success-bg)]", "bg-[var(--status-warning-bg)]", "bg-[var(--status-info-bg)]", "bg-[var(--status-critical-bg)]", "bg-[var(--status-info-bg)]"]
const CARD_ICONS = [Shield, Target, Layers, Activity, Book, Shield]

function StandardsContent() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<"database" | "mapping">("database")

  const { data: standards, isLoading, error, mutate } = useSWR<Standard[]>(
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
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "bg-layer-2 text-muted-foreground hover:bg-layer-3 hover:text-foreground"}`}
              >
                Regulatory Database
              </button>
              <button
                onClick={() => setActiveTab("mapping")}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === "mapping"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "bg-layer-2 text-muted-foreground hover:bg-layer-3 hover:text-foreground"}`}
              >
                Compliance Mapping
              </button>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">
              Standards <span className="text-muted-foreground font-light">Hub</span>
            </h1>
            <p className="text-muted-foreground font-medium">Manage and map your institutional compliance frameworks.</p>
          </div>

          <div className="w-full md:w-1/2 lg:w-1/3">
            <WorkflowTimeline steps={steps} />
          </div>
        </div>
      </header>

      {/* Grid Collections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
        {error ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 rounded-2xl border border-border bg-muted/30">
            <p className="text-muted-foreground text-center mb-4">Failed to load standards.</p>
            <button
              type="button"
              onClick={() => mutate()}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : isLoading ? (
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
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
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
              className="group glass-panel rounded-[32px] p-6 bg-layer-2 border-border hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[220px] animate-fade-in-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex justify-between items-start">
                <div className={`w-12 h-12 rounded-2xl ${c.color} border border-border flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm`}>
                  {(() => { const Icon = CARD_ICONS[i % CARD_ICONS.length]; return <Icon className="w-6 h-6 text-foreground/80 group-hover:text-foreground transition-colors" /> })()}
                </div>
                <div className="w-8 h-8 rounded-full bg-layer-2 border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all -translate-y-2 group-hover:translate-y-0">
                  <ArrowUpRight className="w-4 h-4 text-foreground" />
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">{c.code}</span>
                <h3 className="text-xl font-bold text-foreground mb-4 leading-tight group-hover:text-primary transition-colors">{c.title}</h3>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <span>Alignment Score</span>
                    <span style={{ color: c.equilibrium >= 80 ? "var(--status-success)" : "var(--status-warning)" }}>{c.equilibrium}%</span>
                  </div>
                  <div className="h-1.5 bg-layer-3 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${c.equilibrium ?? 0}%`, backgroundColor: c.equilibrium >= 80 ? "var(--status-success)" : "var(--status-warning)" }} />
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
            <h2 className="text-2xl font-black italic text-foreground">Framework Topology</h2>
            <div className="h-px w-16 bg-border" />
          </div>
          <Link href="/platform/gap-analysis" className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline flex items-center gap-1">
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
                  className="glass-panel p-5 rounded-[24px] bg-layer-2 border-border hover:border-primary/50 flex items-center justify-between hover:bg-layer-2 hover:shadow-lg hover:shadow-primary/5 transition-all group cursor-pointer animate-fade-in-up"
                  style={{ animationDelay: `${(i + 4) * 60}ms` }}
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-layer-3 border border-border flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
                      <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">{std.title}</h4>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                        <span>Last Audit: {report ? new Date(report.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit" }).toUpperCase() : "—"}</span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                        <span>{evidenceNodes} Evidence Assets</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {status && (
                      <span className={`text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full border ${status === "OPTIMAL" ? "badge-verified" : "badge-pending"}`}>
                        {status}
                      </span>
                    )}
                    <button className="w-8 h-8 rounded-full flex items-center justify-center bg-layer-3 text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      <Play className="w-3 h-3 fill-current" />
                    </button>
                  </div>
                </Link>
              )
            })}

            {(standards ?? []).length === 0 && !isLoading && (
              <div className="col-span-full">
                <div className="glass-panel rounded-3xl p-12 text-center border-dashed border-2 border-border bg-layer-2/50">
                  <Target className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium mb-6">No standards available for topology mapping.</p>
                  <StandardsTemplatesButton onSelect={(template: Template) => {
                    window.location.href = `/platform/standards/new?template=${template.id}`
                  }} />
                </div>
              </div>
            )}
          </div>

          <div className="glass-layer-2 rounded-[32px] p-8 flex flex-col relative overflow-hidden group border border-[var(--glass-border)]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 rounded-lg bg-muted/80 border border-[var(--glass-border)]">
                  <Shield className="w-5 h-5 text-muted-foreground" />
                </div>
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Intelligence Summary</h4>
              </div>

              <p className="text-lg font-medium leading-relaxed mb-8 text-foreground">
                Current institutional framework contains <span className="text-primary font-bold text-2xl">{collections.length}</span> active standards.
                {(() => {
                  const needsReview = (standards ?? []).find((s) => getStandardStatus(s.id) === "WARNING")
                  return needsReview
                    ? <> Horus recommends a compliance review of the <span className="font-bold border-b border-[var(--status-warning)]" style={{ color: "var(--status-warning)" }}>{needsReview.title}</span> framework.</>
                    : " All frameworks are within compliance targets."
                })()}
              </p>

              <Link href="/platform/gap-analysis" className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all text-center block shadow-lg shadow-primary/20 active:scale-95">
                Generate Compliance Briefing
              </Link>
            </div>

            <div className="mt-auto pt-8 border-t border-[var(--glass-border)] flex items-center gap-4 relative z-10">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "var(--status-success)" }} />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Ayn Core Live Sync</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}


