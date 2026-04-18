import { FileText, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { PlatformEvidence, Evidence } from "@/types"

interface EvidenceCardProps {
    evidence: PlatformEvidence | Evidence
    onClick?: () => void
    onDelete?: () => void
}

const STATUS_LABELS: Record<string, string> = {
    pending: "Pending",
    processing: "Processing",
    analyzed: "Analyzed",
    linked: "Linked",
    failed: "Failed",
    complete: "Complete",
    void: "Voided",
}

function getStatusStyle(status: string) {
    const isSuccess = ["complete", "analyzed", "linked"].includes(status)
    const isError = ["void", "failed"].includes(status)
    const isActive = ["pending", "processing"].includes(status)

    return {
        label: STATUS_LABELS[status] ?? status,
        badgeClass: isSuccess
            ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/25"
            : isError
            ? "text-destructive bg-destructive/10 border-destructive/25"
            : "text-amber-500 bg-amber-500/10 border-amber-500/25",
        dotClass: isSuccess
            ? "bg-emerald-500"
            : isError
            ? "bg-destructive"
            : "bg-amber-500",
        // Only animate for states that are genuinely in progress
        animate: isActive,
    }
}

export function EvidenceCard({ evidence, onClick, onDelete }: EvidenceCardProps) {
    const status = evidence.status
    const title = evidence.title || "Untitled Document"

    const dateStr =
        "created_at" in evidence
            ? evidence.created_at
            : (evidence as any).createdAt || new Date().toISOString()

    const criteriaCount =
        "criteria_refs" in evidence
            ? evidence.criteria_refs.length
            : (evidence as any).criteria?.length || 0

    const confidence = (evidence as any).confidenceScore
    const rawDocType =
        (evidence as any).documentType ||
        (evidence as any).mimeType?.split("/")?.[1] ||
        null
    const docTypeLabel = rawDocType
        ? rawDocType.toUpperCase().replace("VND.OPENXMLFORMATS-OFFICEDOCUMENT.WORDPROCESSINGML.DOCUMENT", "DOCX")
        : "Document"

    const { label, badgeClass, dotClass, animate } = getStatusStyle(status)

    return (
        <div
            onClick={onClick}
            className="group relative flex h-full flex-col rounded-[22px] border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] p-5 transition-all duration-200 cursor-pointer hover:border-primary/30 hover:bg-[var(--surface)] hover:shadow-lg hover:shadow-primary/5"
        >
            {onDelete && (
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation()
                        onDelete()
                    }}
                    className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-transparent bg-background/80 text-muted-foreground opacity-0 shadow-sm transition-all hover:border-destructive/25 hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    aria-label="Delete evidence"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            )}
            {/* Top accent line */}
            <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(37,99,235,0.5),transparent)] opacity-0 transition-opacity group-hover:opacity-100" />

            {/* Status + Date */}
            <div className="flex items-center justify-between gap-2 mb-3">
                <span
                    className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold",
                        badgeClass,
                    )}
                >
                    <span
                        className={cn(
                            "h-1.5 w-1.5 shrink-0 rounded-full",
                            dotClass,
                            animate && "animate-pulse",
                        )}
                    />
                    {label}
                </span>
                <span className="text-[10px] text-muted-foreground tabular-nums">
                    {new Date(dateStr).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                    })}
                </span>
            </div>

            {/* Title */}
            <h3 className="font-semibold text-sm text-foreground leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                {title}
            </h3>

            {/* Doc type + confidence */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                <span>{docTypeLabel}</span>
                {confidence != null && confidence > 0 && (
                    <>
                        <span className="opacity-30">·</span>
                        <span>{Math.round(confidence)}% match</span>
                    </>
                )}
            </div>

            {/* Footer */}
            <div className="mt-auto pt-3 border-t border-[var(--glass-border)] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <FileText className="h-3.5 w-3.5 shrink-0 opacity-50" />
                    {criteriaCount > 0 ? (
                        <span>
                            {criteriaCount} {criteriaCount === 1 ? "criterion" : "criteria"} linked
                        </span>
                    ) : (
                        <span className="italic opacity-60">Not analyzed</span>
                    )}
                </div>
            </div>
        </div>
    )
}
