import { FileText, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { PlatformEvidence, Evidence } from "@/types"
import { useUiLanguage } from "@/lib/ui-language-context"

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
        animate: isActive,
    }
}

function formatCardDate(raw: string, isArabic: boolean): string {
    const d = new Date(raw)
    if (Number.isNaN(d.getTime())) return ""
    return d.toLocaleDateString(isArabic ? "ar-EG" : "en-US", {
        day: "numeric",
        month: "short",
    })
}

export function EvidenceCard({ evidence, onClick, onDelete }: EvidenceCardProps) {
    const { isArabic } = useUiLanguage()
    const status = evidence.status
    const title = evidence.title || (isArabic ? "مستند بلا عنوان" : "Untitled Document")

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
        : isArabic ? "مستند" : "Document"

    const { label, badgeClass, dotClass, animate } = getStatusStyle(status)
    const localizedLabel =
        ({
            Pending: isArabic ? "قيد الانتظار" : "Pending",
            Processing: isArabic ? "قيد المعالجة" : "Processing",
            Analyzed: isArabic ? "تم التحليل" : "Analyzed",
            Linked: isArabic ? "مرتبط" : "Linked",
            Failed: isArabic ? "فشل" : "Failed",
            Complete: isArabic ? "مكتمل" : "Complete",
            Voided: isArabic ? "ملغي" : "Voided",
        } as Record<string, string>)[label] ?? label

    return (
        <div
            onClick={onClick}
            className="group relative flex h-full flex-col rounded-[22px] border border-[var(--glass-border)] bg-[var(--glass-soft-bg)] p-5 transition-all duration-200 cursor-pointer hover:border-primary/30 hover:bg-[var(--surface)] hover:shadow-lg hover:shadow-primary/5"
        >
            {/* Top accent line on hover */}
            <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(37,99,235,0.5),transparent)] opacity-0 transition-opacity group-hover:opacity-100 rounded-t-[22px]" />

            {/* Status badge row */}
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
                    {localizedLabel}
                </span>
                {/* Date — always visible; no absolute positioning so no overlap */}
                <span className="text-[10px] text-muted-foreground/70 tabular-nums shrink-0">
                    {formatCardDate(dateStr, isArabic)}
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
                        <span className="text-emerald-500 font-medium">{Math.round(confidence)}% {isArabic ? "تطابق" : "match"}</span>
                    </>
                )}
            </div>

            {/* Footer: criteria info + delete button */}
            <div className="mt-auto pt-3 border-t border-[var(--glass-border)] flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                    <FileText className="h-3.5 w-3.5 shrink-0 opacity-50" />
                    {criteriaCount > 0 ? (
                        <span className="truncate">
                            {criteriaCount} {isArabic
                                ? (criteriaCount === 1 ? "معيار مرتبط" : "معايير مرتبطة")
                                : (criteriaCount === 1 ? "criterion linked" : "criteria linked")}
                        </span>
                    ) : (
                        <span className="italic opacity-60 truncate">{isArabic ? "لم يُحلل بعد" : "Not analyzed"}</span>
                    )}
                </div>

                {/* Delete — only shows on card hover, lives in footer so no overlap */}
                {onDelete && (
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation()
                            onDelete()
                        }}
                        className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full border border-transparent text-muted-foreground/40 opacity-0 transition-all hover:border-destructive/25 hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                        aria-label={isArabic ? "حذف الدليل" : "Delete evidence"}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>
        </div>
    )
}
