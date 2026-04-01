import { FileText, MoreVertical, ShieldAlert, CheckCircle2, AlertCircle, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { PlatformEvidence, Evidence } from "@/types"

interface EvidenceCardProps {
    evidence: PlatformEvidence | Evidence
    onClick?: () => void
}

export function EvidenceCard({ evidence, onClick }: EvidenceCardProps) {
    const status = evidence.status
    const title = evidence.title || "Untitled Document"

    // Handle different date formats
    const dateStr = 'created_at' in evidence
        ? evidence.created_at
        : (evidence as any).createdAt || new Date().toISOString()

    // Handle criteria counts
    const criteriaCount = 'criteria_refs' in evidence
        ? evidence.criteria_refs.length
        : (evidence as any).criteria?.length || 0

    const sourceFileCount = 'source_file_ids' in evidence
        ? evidence.source_file_ids.length
        : 0

    const isSuccess = ['complete', 'analyzed', 'linked'].includes(status)
    const isError = ['void', 'failed'].includes(status)
    const confidence = (evidence as any).confidenceScore
    const documentType = (evidence as any).documentType || (evidence as any).mimeType?.split("/")?.[1] || "Document"
    
    const dotColor = isSuccess ? "bg-emerald-500" : isError ? "bg-destructive" : "bg-amber-500"
    const badgeStyle = isSuccess 
      ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" 
      : isError 
        ? "text-destructive bg-destructive/10 border-destructive/20" 
        : "text-amber-500 bg-amber-500/10 border-amber-500/20"

    return (
        <div
            onClick={onClick}
            className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 transition-all duration-300 cursor-pointer hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
        >
            <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(37,99,235,0.75),transparent)] opacity-60" />
            <div className="absolute -right-6 top-0 h-20 w-20 rounded-full bg-primary/10 blur-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="flex justify-between items-start mb-4">
                <div className={cn(
                    "px-2.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border flex items-center gap-2",
                    badgeStyle
                )}>
                    <div className="relative flex h-2 w-2 items-center justify-center">
                      <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", dotColor)} />
                      <span className={cn("relative inline-flex rounded-full h-1.5 w-1.5", dotColor)} />
                    </div>
                    {evidence.status}
                </div>
                {isSuccess && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                    <Sparkles className="w-3 h-3" />
                    <span className="text-[9px] font-black uppercase tracking-tighter">Ayn Verified</span>
                  </div>
                )}
                <button className="p-1.5 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100">
                    <MoreVertical className="w-4 h-4" />
                </button>
            </div>

            <div className="mb-4">
                <h3 className="font-bold text-foreground group-hover:text-primary transition-colors leading-tight mb-1 line-clamp-2">
                    {title}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full border border-white/8 bg-white/[0.04] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                        {documentType}
                    </span>
                    {confidence != null && (
                        <span className="inline-flex rounded-full border border-[var(--status-success-border)] bg-[var(--status-success-bg)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--status-success)]">
                            {Math.round(confidence)}% confidence
                        </span>
                    )}
                </div>
                <p className="mt-3 text-xs text-muted-foreground line-clamp-2">
                    {criteriaCount > 0
                        ? `Linked to ${criteriaCount} criteria${sourceFileCount > 0 ? ` in ${sourceFileCount} files` : ''}.`
                        : "No criteria linked yet."}
                </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 border-2 border-transparent flex items-center justify-center text-[8px] font-bold text-primary">
                        S
                    </div>
                    {criteriaCount > 1 && (
                        <div className="w-6 h-6 rounded-full glass-layer-3 border-2 border-transparent flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                            +{criteriaCount - 1}
                        </div>
                    )}
                </div>
                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.12em]">
                    {new Date(dateStr).toLocaleDateString()}
                </div>
            </div>
        </div>
    )
}
