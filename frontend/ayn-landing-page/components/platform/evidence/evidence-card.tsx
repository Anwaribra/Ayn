import { FileText, MoreVertical, ShieldAlert, CheckCircle2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { PlatformEvidence } from "@/types"

interface EvidenceCardProps {
    evidence: PlatformEvidence
    onClick?: () => void
}

export function EvidenceCard({ evidence, onClick }: EvidenceCardProps) {
    const statusColors = {
        defined: "bg-zinc-100 text-zinc-600 border-zinc-200",
        linked: "bg-blue-50 text-blue-700 border-blue-200",
        complete: "bg-emerald-50 text-emerald-700 border-emerald-200",
        void: "bg-rose-50 text-rose-700 border-rose-200",
    }

    const statusIcons = {
        defined: AlertCircle,
        linked: FileText,
        complete: CheckCircle2,
        void: ShieldAlert,
    }

    const StatusIcon = statusIcons[evidence.status as keyof typeof statusIcons] || FileText

    return (
        <div
            onClick={onClick}
            className="group relative flex flex-col justify-between p-5 rounded-3xl bg-white border border-zinc-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 cursor-pointer h-full"
        >
            <div className="flex justify-between items-start mb-4">
                <div className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border flex items-center gap-1.5",
                    statusColors[evidence.status as keyof typeof statusColors] || statusColors.defined
                )}>
                    <StatusIcon className="w-3 h-3" />
                    {evidence.status}
                </div>
                <button className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                </button>
            </div>

            <div className="mb-4">
                <h3 className="font-bold text-zinc-900 group-hover:text-blue-600 transition-colors leading-tight mb-1 line-clamp-2">
                    {evidence.title}
                </h3>
                <p className="text-xs text-zinc-500 line-clamp-2">
                    {evidence.criteria_refs.length > 0
                        ? `Linked to ${evidence.criteria_refs.length} criteria in ${evidence.source_file_ids.length} files.`
                        : "No criteria linked yet."}
                </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-50 mt-auto">
                <div className="flex -space-x-2">
                    {/* Placeholder for standard icons or avatars related to this evidence */}
                    <div className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-blue-600">
                        S
                    </div>
                    {evidence.criteria_refs.length > 1 && (
                        <div className="w-6 h-6 rounded-full bg-zinc-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-zinc-600">
                            +{evidence.criteria_refs.length - 1}
                        </div>
                    )}
                </div>
                <div className="text-[10px] font-medium text-zinc-400">
                    {new Date(evidence.created_at).toLocaleDateString()}
                </div>
            </div>
        </div>
    )
}
