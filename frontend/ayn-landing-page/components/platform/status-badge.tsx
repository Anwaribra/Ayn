import { cn } from "@/lib/utils"
import type { AssessmentStatus } from "@/lib/types"

interface StatusBadgeProps {
  status: AssessmentStatus
  size?: "sm" | "md"
}

const statusConfig = {
  DRAFT: {
    label: "Draft",
    className: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
  },
  SUBMITTED: {
    label: "Submitted",
    className: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
  REVIEWED: {
    label: "Reviewed",
    className: "bg-green-500/20 text-green-300 border-green-500/30",
  },
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        config.className,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
      )}
    >
      {config.label}
    </span>
  )
}
