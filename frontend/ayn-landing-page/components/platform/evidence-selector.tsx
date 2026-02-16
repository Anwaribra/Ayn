"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search, FileText, Shield, File, X } from "lucide-react"
import useSWR from "swr"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Evidence } from "@/types"

interface EvidenceSelectorProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelect: (evidence: Evidence) => void
}

export function EvidenceSelector({ open, onOpenChange, onSelect }: EvidenceSelectorProps) {
    const [searchQuery, setSearchQuery] = React.useState("")
    const { data: evidence, isLoading } = useSWR<Evidence[]>(
        open ? "evidence" : null,
        () => api.getEvidence()
    )

    const filteredEvidence = React.useMemo(() => {
        if (!evidence) return []
        if (!searchQuery) return evidence
        const lower = searchQuery.toLowerCase()
        return evidence.filter((e) =>
            e.title?.toLowerCase().includes(lower) ||
            e.originalFilename?.toLowerCase().includes(lower) ||
            e.documentType?.toLowerCase().includes(lower)
        )
    }, [evidence, searchQuery])

    const getIcon = (type: string) => {
        if (type === "policy") return Shield
        if (type === "procedure") return FileText
        return File
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] bg-[var(--surface-modal)] border-[var(--border-subtle)] p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b border-[var(--border-subtle)]">
                    <DialogTitle>Select Evidence</DialogTitle>
                    <DialogDescription>
                        Choose existing evidence to address this compliance gap.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--surface-subtle)]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            className="w-full bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all placeholder:text-muted-foreground"
                            placeholder="Search evidence..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                <div className="max-h-[400px] overflow-y-auto p-2">
                    {isLoading ? (
                        <div className="py-8 text-center text-muted-foreground text-sm">Loading evidence...</div>
                    ) : filteredEvidence.length === 0 ? (
                        <div className="py-12 text-center">
                            <div className="w-12 h-12 rounded-full bg-[var(--surface)] flex items-center justify-center mx-auto mb-3">
                                <Search className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground text-sm">No evidence found matching "{searchQuery}"</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredEvidence.map((item) => {
                                const Icon = getIcon(item.documentType || "")
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            onSelect(item)
                                            onOpenChange(false)
                                        }}
                                        className="w-full text-left p-3 rounded-xl hover:bg-accent transition-colors flex items-start gap-4 group border border-transparent hover:border-border"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-[var(--surface)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 group-hover:bg-accent group-hover:border-border transition-all">
                                            <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-foreground truncate mb-0.5">
                                                {item.title || item.originalFilename || "Untitled Evidence"}
                                            </h4>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-[var(--surface)] px-1.5 py-0.5 rounded border border-[var(--border-subtle)]">
                                                    {item.documentType || "Document"}
                                                </span>
                                                <span className="text-xs text-muted-foreground truncate">
                                                    {new Date(item.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
