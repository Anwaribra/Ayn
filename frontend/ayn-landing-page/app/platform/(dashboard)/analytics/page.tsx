"use client"

import { ProtectedRoute } from "@/components/platform/protected-route"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import useSWR from "swr"
import { BarChart3, Download, Filter, Share2, Target, Zap, Globe, Cpu, FileText } from "lucide-react"
import type { DashboardMetrics, GapAnalysisListItem, Evidence } from "@/types"

export default function AnalyticsPage() {
  return (
    <ProtectedRoute>
      <AnalyticsContent />
    </ProtectedRoute>
  )
}

function AnalyticsContent() {
  const { user } = useAuth()
  
  const { data: metrics, isLoading: metricsLoading } = useSWR<DashboardMetrics>(
    user ? [`dashboard-metrics`, user.id] : null,
    () => api.getDashboardMetrics(),
  )
  
  const { data: gapAnalyses } = useSWR<GapAnalysisListItem[]>(
    user ? [`gap-analyses`, user.id] : null,
    () => api.getGapAnalyses(),
  )

  const { data: evidence } = useSWR<Evidence[]>(
    user ? [`evidence`, user.id] : null,
    () => api.getEvidence(),
  )

  const healthScore = metrics?.assessmentProgressPercentage ?? 0
  const evidenceCount = metrics?.evidenceCount ?? 0
  const completedCriteria = metrics?.completedCriteriaCount ?? 0
  const activeGaps = gapAnalyses?.length ?? 0

  return (
    <div className="animate-fade-in-up pb-20">
      <header className="mb-10 pt-6 flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="px-2 py-0.5 rounded bg-zinc-800 border border-white/5">
               <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Analytics Layer</span>
             </div>
             <div className="h-px w-6 bg-zinc-900" />
             <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Institutional Intelligence</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight italic text-white">Reports & <span className="text-zinc-700 not-italic font-light">Insights</span></h1>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-5 py-2 glass-panel rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all border-white/5">
            <Filter className="w-3 h-3" /> Filter Period
          </button>
          <button className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-blue-600/10 active:scale-95 transition-all">
            <Download className="w-3 h-3" /> Export Intelligence
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12 px-4">
        {/* Neural Trend Chart - Shows real metrics or empty state */}
        <div className="lg:col-span-2 glass-panel p-8 rounded-[40px] relative overflow-hidden border-white/5">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Institutional Pulse</h3>
              <p className="text-[11px] font-bold text-zinc-600 uppercase tracking-widest">Compliance Equilibrium Overview</p>
            </div>
            <div className="flex gap-4">
               <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                 <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Health</span>
               </div>
            </div>
          </div>
          
          {metricsLoading ? (
            <div className="h-56 flex items-center justify-center">
              <div className="text-zinc-600 text-sm">Loading metrics...</div>
            </div>
          ) : metrics ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-panel p-4 rounded-2xl border-white/5">
                <div className="text-3xl font-black text-white mono">{Math.round(healthScore)}%</div>
                <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Health Score</div>
              </div>
              <div className="glass-panel p-4 rounded-2xl border-white/5">
                <div className="text-3xl font-black text-white mono">{evidenceCount}</div>
                <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Evidence Items</div>
              </div>
              <div className="glass-panel p-4 rounded-2xl border-white/5">
                <div className="text-3xl font-black text-white mono">{completedCriteria}</div>
                <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Standards Met</div>
              </div>
              <div className="glass-panel p-4 rounded-2xl border-white/5">
                <div className="text-3xl font-black text-white mono">{activeGaps}</div>
                <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Active Gaps</div>
              </div>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center">
              <div className="text-zinc-600 text-sm italic">No metrics available. Run a gap analysis to generate insights.</div>
            </div>
          )}
        </div>

        {/* Performance Distribution Card */}
        <div className="glass-panel p-8 rounded-[40px] border-white/5 flex flex-col relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl pointer-events-none" />
           <h3 className="text-lg font-bold text-white mb-8">Performance Distribution</h3>
           <div className="flex-1 space-y-6 flex flex-col justify-center">
              {[
                { label: 'Institutional Health', score: Math.round(healthScore), color: 'bg-blue-500', icon: Target },
                { label: 'Evidence Coverage', score: evidenceCount > 0 ? Math.min(100, evidenceCount * 5) : 0, color: 'bg-indigo-500', icon: FileText },
                { label: 'Standards Compliance', score: completedCriteria > 0 ? Math.min(100, completedCriteria * 10) : 0, color: 'bg-cyan-500', icon: Zap },
                { label: 'Gap Remediation', score: activeGaps === 0 ? 100 : Math.max(0, 100 - activeGaps * 10), color: 'bg-emerald-500', icon: Globe },
              ].map((item, i) => (
                <div key={i} className="group">
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex items-center gap-3">
                      <item.icon className="w-3.5 h-3.5 text-zinc-600 group-hover:text-white transition-colors" />
                      <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-tight group-hover:text-zinc-300 transition-colors">{item.label}</span>
                    </div>
                    <span className="mono text-[11px] font-bold text-white">{metricsLoading ? '-' : item.score}%</span>
                  </div>
                  <div className="h-1 bg-white/[0.03] rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(37,99,235,0.2)]`} style={{ width: metricsLoading ? '0%' : `${item.score}%` }} />
                  </div>
                </div>
              ))}
           </div>
           <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
             <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest">{metricsLoading ? 'Syncing...' : 'Sync Health: 100%'}</span>
             <BarChart3 className="w-4 h-4 text-zinc-800" />
           </div>
        </div>
      </div>

      <section className="px-4">
        <div className="flex items-center gap-4 mb-8">
           <h2 className="text-2xl font-black italic text-white">Neural Briefings</h2>
           <div className="h-px w-20 bg-zinc-900" />
        </div>
        
        {gapAnalyses && gapAnalyses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gapAnalyses.slice(0, 4).map((item, i) => (
              <div key={item.id} className="glass-panel p-5 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-white/[0.04] transition-all border-white/5">
                <div className="flex items-center gap-5">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
                    <span className="mono text-[9px] font-bold text-zinc-600 group-hover:text-blue-500 transition-colors">
                      {item.overallScore >= 80 ? 'PASS' : item.overallScore >= 50 ? 'WARN' : 'FAIL'}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold text-zinc-200 group-hover:text-white transition-colors">{item.standardTitle} Analysis</h4>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">
                      {new Date(item.createdAt).toLocaleDateString()} • Score: {Math.round(item.overallScore)}%
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
                  <button className="p-2 text-zinc-600 hover:text-white transition-colors"><Share2 className="w-4 h-4" /></button>
                  <button className="p-2 text-zinc-600 hover:text-white transition-colors"><Download className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        ) : evidence && evidence.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {evidence.slice(0, 4).map((item) => (
              <div key={item.id} className="glass-panel p-5 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-white/[0.04] transition-all border-white/5">
                <div className="flex items-center gap-5">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
                    <span className="mono text-[9px] font-bold text-zinc-600 group-hover:text-blue-500 transition-colors">EVIDENCE</span>
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold text-zinc-200 group-hover:text-white transition-colors truncate max-w-[200px]">{item.fileName}</h4>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">
                      {new Date(item.createdAt).toLocaleDateString()} • {item.criterionId ? 'Linked' : 'Unlinked'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
                  <button className="p-2 text-zinc-600 hover:text-white transition-colors"><Share2 className="w-4 h-4" /></button>
                  <button className="p-2 text-zinc-600 hover:text-white transition-colors"><Download className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel p-8 rounded-2xl border-white/5 text-center">
            <FileText className="w-10 h-10 text-zinc-800 mx-auto mb-4" />
            <p className="text-zinc-600 text-sm italic">No briefings available. Upload evidence or run gap analyses to generate reports.</p>
          </div>
        )}
      </section>
    </div>
  )
}
