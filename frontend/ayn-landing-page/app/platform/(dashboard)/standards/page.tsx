"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/platform/protected-route"
import { api } from "@/lib/api"
import useSWR from "swr"
import Link from "next/link"
import {
  BookOpen,
  Plus,
  Search,
  ArrowRight,
  ChevronRight,
  Layers,
  CheckCircle2,
  FileText,
} from "lucide-react"
import type { Standard } from "@/types/standards"

export default function StandardsPage() {
  return (
    <ProtectedRoute>
      <StandardsContent />
    </ProtectedRoute>
  )
}

function StandardsContent() {
  const [search, setSearch] = useState("")

  const { data: standards, isLoading } = useSWR<Standard[]>(
    "standards",
    () => api.getStandards(),
  )

  const filtered = (standards ?? []).filter(
    (s) =>
      !search ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.description?.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="animate-fade-in-up p-4 md:p-6 pb-20 max-w-[1440px] mx-auto">
      {/* ── Header ───────────────────────────────────────────────── */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
              <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-[0.2em]">
                Framework Layer
              </span>
            </div>
            <div className="h-px w-6 bg-zinc-800" />
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">
              Accreditation Protocols
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter italic text-white">
            STANDARDS <span className="text-zinc-700 not-italic font-light">HUB</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/platform/standards/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-blue-600/10 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            New Standard
          </Link>
        </div>
      </header>

      {/* ── Search ────────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
            placeholder="Search standards and frameworks..."
            className="w-full h-11 bg-white/[0.02] border border-white/[0.06] rounded-xl pl-11 pr-4 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-blue-500/30 transition-all"
          />
        </div>
      </div>

      {/* ── Stats bar ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-6 mb-8 px-2">
        <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
          {filtered.length} {filtered.length === 1 ? "standard" : "standards"}
        </span>
        <div className="h-px flex-1 bg-zinc-900" />
      </div>

      {/* ── Standards grid ────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-panel rounded-[28px] p-6 border-white/5 animate-pulse">
              <div className="h-5 w-3/4 bg-white/[0.04] rounded mb-4" />
              <div className="h-3 w-full bg-white/[0.03] rounded mb-2" />
              <div className="h-3 w-2/3 bg-white/[0.03] rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel rounded-[40px] p-16 border-white/5 text-center">
          <BookOpen className="w-10 h-10 text-zinc-800 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-zinc-400 mb-2">No standards found</h3>
          <p className="text-[11px] text-zinc-600 font-medium max-w-sm mx-auto">
            {search
              ? "Try adjusting your search term"
              : "Create your first accreditation standard to get started"}
          </p>
          {!search && (
            <Link
              href="/platform/standards/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 mt-6 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-blue-600/10 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Standard
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((standard) => (
            <Link
              key={standard.id}
              href={`/platform/standards/${standard.id}`}
              className="group glass-panel platform-card rounded-[28px] p-6 border-white/5 hover:shadow-xl flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-5 h-5 text-cyan-500 opacity-70 group-hover:opacity-100 transition-opacity" />
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-800 group-hover:text-zinc-400 group-hover:translate-x-1 transition-all" />
              </div>

              <h3 className="text-[15px] font-bold text-zinc-100 mb-2 group-hover:text-white transition-colors line-clamp-2">
                {standard.title}
              </h3>

              {standard.description && (
                <p className="text-[11px] text-zinc-600 font-medium leading-relaxed line-clamp-3 flex-1">
                  {standard.description}
                </p>
              )}

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest">
                  Accreditation Standard
                </span>
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-zinc-700" />
                  <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest">
                    View Details
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
