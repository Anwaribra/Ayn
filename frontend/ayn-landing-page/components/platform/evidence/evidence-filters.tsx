"use client"

import { Search, Filter, SlidersHorizontal } from "lucide-react"

export function EvidenceFilters() {
    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                    type="text"
                    placeholder="Search evidence by title, content, or ID..."
                    className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                />
            </div>
            <div className="flex gap-2">
                <button className="flex items-center gap-2 px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-bold text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 transition-all shadow-sm">
                    <Filter className="w-4 h-4" />
                    By Standard
                </button>
                <button className="flex items-center gap-2 px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-bold text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 transition-all shadow-sm">
                    <SlidersHorizontal className="w-4 h-4" />
                    Status
                </button>
            </div>
        </div>
    )
}
