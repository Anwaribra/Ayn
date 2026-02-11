"use client"

import { ProtectedRoute } from "@/components/platform/protected-route"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import useSWR from "swr"
import Link from "next/link"
import {
  Book,
  Shield,
  ArrowUpRight,
  Target,
  Layers,
  Activity,
  Play,
} from "lucide-react"
import type { Standard } from "@/types"

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

  const { data: standards, isLoading } = useSWR<Standard[]>(
    user ? "standards" : null,
    () => api.getStandards(),
  )

  // Map API standards to V3 collection cards
  const collections = (standards ?? []).map((s: Standard, i: number) => ({
    id: s.id,
    title: s.title,
    code: s.id.slice(0, 8).toUpperCase(),
    color: CARD_COLORS[i % CARD_COLORS.length],
  }))

  return (
    <div className="animate-fade-in-up pb-20">
      <header className="mb-10 pt-6 px-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
              <span className="text-[8px] font-bold text-blue-400 uppercase tracking-widest">Regulatory Database</span>
            </div>
            <div className="h-px w-6 bg-zinc-800" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Compliance Mapping</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter italic text-white">
            Standards <span className="text-zinc-700 not-italic font-light">Hub</span>
          </h1>
        </div>
      </header>

      {/* Grid Collections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 px-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i: number) => (
            <div key={i} className="glass-panel rounded-[32px] p-6 border-white/5 aspect-square animate-pulse" />
          ))
        ) : collections.length === 0 ? (
          <div className="col-span-full text-center py-20">
            <Shield className="w-10 h-10 text-zinc-800 mx-auto mb-4" />
            <p className="text-sm text-zinc-600 italic">No standards have been created yet.</p>
            <Link href="/platform/standards/new" className="inline-block mt-6 px-8 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xl">
              Create Standard
            </Link>
          </div>
        ) : (
          collections.map((c: { id: string; title: string; code: string; color: string }, i: number) => (
            <Link
              key={c.id}
              href={`/platform/standards/${c.id}`}
              className="group glass-panel rounded-[32px] p-6 border-white/5 hover:bg-white/[0.04] transition-all duration-500 cursor-pointer flex flex-col justify-between aspect-square"
            >
              <div className="flex justify-between items-start">
                <div className={`w-12 h-12 rounded-2xl ${c.color} border border-white/10 flex items-center justify-center transition-transform group-hover:scale-105`}>
                  {(() => { const Icon = CARD_ICONS[i % CARD_ICONS.length]; return <Icon className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" /> })()}
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-800 group-hover:text-blue-500 transition-colors" />
              </div>

              <div>
                <span className="mono text-[9px] font-bold text-zinc-600 uppercase tracking-widest block mb-1">{c.code}</span>
                <h3 className="text-xl font-bold text-white mb-4 leading-tight">{c.title}</h3>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    <span>Equilibrium</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: "0%" }} />
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Framework Topology Explorer */}
      <section className="px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black italic">Framework Topology</h2>
            <div className="h-px w-16 bg-zinc-800" />
          </div>
          <Link href="/platform/gap-analysis" className="text-[10px] font-bold text-blue-500 uppercase tracking-widest hover:underline">
            Full System Scan
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {(standards ?? []).slice(0, 4).map((std: Standard, i: number) => {
              const Icon = CARD_ICONS[i % CARD_ICONS.length]
              return (
                <Link
                  key={std.id}
                  href={`/platform/standards/${std.id}`}
                  className="glass-panel p-5 rounded-3xl border-white/5 flex items-center justify-between hover:bg-white/[0.03] transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-zinc-500 group-hover:text-blue-500 transition-colors" />
                    </div>
                    <div>
                      <h4 className="text-[14px] font-bold text-zinc-100">{std.title}</h4>
                      <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">
                        {std.description ?? "No description"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <button className="p-2 text-zinc-700 hover:text-white opacity-0 group-hover:opacity-100 transition-all">
                      <Play className="w-4 h-4" />
                    </button>
                  </div>
                </Link>
              )
            })}

            {(standards ?? []).length === 0 && !isLoading && (
              <div className="text-center py-12 text-zinc-600 text-sm italic">No standards to map.</div>
            )}
          </div>

          <div className="glass-panel rounded-[32px] p-8 border-white/5 flex flex-col">
            <div className="flex items-center gap-3 mb-8">
              <Shield className="w-5 h-5 text-blue-500" />
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Intelligence Summary</h4>
            </div>
            <p className="text-sm text-zinc-400 font-medium leading-relaxed mb-8">
              Current institutional framework contains <span className="text-white">{collections.length}</span> active standards. Horus recommends a compliance review of the <span className="text-amber-500">Curriculum Alignment</span> framework before the Q3 audit cycle.
            </p>
            <Link href="/platform/gap-analysis" className="w-full py-4 rounded-2xl bg-white/5 border border-white/5 text-[11px] font-bold text-zinc-300 hover:bg-white/10 transition-all text-center block">
              Generate Compliance Briefing
            </Link>
            <div className="mt-auto pt-6 border-t border-white/5 flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Ayn Core Live Sync</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
