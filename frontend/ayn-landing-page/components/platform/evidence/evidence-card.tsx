import { FileText, MoreVertical, ShieldAlert, CheckCircle2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { PlatformEvidence, Evidence } from "@/types"

interface EvidenceCardProps {
    evidence: PlatformEvidence | Evidence
    onClick?: () => void
}

export function EvidenceCard({ evidence, onClick }: EvidenceCardProps) {
    const statusClasses = {
        defined: "badge-pending",
        linked: "badge-analyzed",
        complete: "badge-verified",
        void: "badge-failed",
    }

    const statusIcons = {
        defined: AlertCircle,
        linked: FileText,
        complete: CheckCircle2,
        void: ShieldAlert,
    }

    // Normalize data access
    const status = evidence.status as keyof typeof statusIcons
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

    const StatusIcon = statusIcons[status] || FileText
    const statusClass = statusClasses[status] || "badge-pending"

    return (
        <div
            onClick={onClick}
            className="group relative flex flex-col justify-between p-5 rounded-3xl bg-layer-2 border border-border hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer h-full"
        >
            <div className="flex justify-between items-start mb-4">
                <div className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border flex items-center gap-1.5",
                    statusClass
                )}>
                    <StatusIcon className="w-3 h-3" />
                    {evidence.status}
                </div>
                <button className="p-1.5 rounded-full hover:bg-layer-3 text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100">
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
                    <div className="w-6 h-6 rounded-full bg-primary/10 border-2 border-layer-2 flex items-center justify-center text-[8px] font-bold text-primary">
                        S
                    </div>
                    {criteriaCount > 1 && (
                        <div className="w-6 h-6 rounded-full bg-layer-3 border-2 border-layer-2 flex items-center justify-center text-[8px] font-bold text-muted-foreground">
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
