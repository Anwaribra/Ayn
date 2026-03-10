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
    
    const dotColor = isSuccess ? "bg-emerald-500" : isError ? "bg-destructive" : "bg-amber-500"
    const badgeStyle = isSuccess 
      ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" 
      : isError 
        ? "text-destructive bg-destructive/10 border-destructive/20" 
        : "text-amber-500 bg-amber-500/10 border-amber-500/20"

    return (
        <div
            onClick={onClick}
            className="group relative flex flex-col justify-between p-5 rounded-3xl glass-layer-2 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer h-full"
        >
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
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary animate-pulse">
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
                <p className="text-xs text-muted-foreground line-clamp-2">
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
                <div className="text-[10px] font-medium text-muted-foreground">
                    {new Date(dateStr).toLocaleDateString()}
                </div>
            </div>
        </div>
    )
}
