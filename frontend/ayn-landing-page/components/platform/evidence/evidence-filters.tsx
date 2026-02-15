"use client"

import { Search, Filter, SlidersHorizontal } from "lucide-react"

export function EvidenceFilters() {
    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search evidence by title, content, or ID..."
                    className="w-full pl-11 pr-4 py-3 bg-layer-2 border border-border rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                />
            </div>
            <div className="flex gap-2">
                <button className="flex items-center gap-2 px-4 py-3 bg-layer-2 border border-border rounded-xl text-sm font-bold text-muted-foreground hover:bg-layer-3 hover:text-foreground hover:border-primary/30 transition-all shadow-sm">
                    <Filter className="w-4 h-4" />
                    By Standard
                </button>
                <button className="flex items-center gap-2 px-4 py-3 bg-layer-2 border border-border rounded-xl text-sm font-bold text-muted-foreground hover:bg-layer-3 hover:text-foreground hover:border-primary/30 transition-all shadow-sm">
                    <SlidersHorizontal className="w-4 h-4" />
                    Status
                </button>
            </div>
        </div>
    )
}
