import { cn } from "@/lib/utils"
import { ReactNode, HTMLAttributes } from "react"

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode
    className?: string
    gradient?: boolean
    hoverEffect?: boolean
    shine?: boolean
    variant?: 1 | 2 | 3 | 4
}

export function GlassCard({
    children,
    className,
    gradient = false,
    hoverEffect = false,
    shine = false,
    variant = 1,
    ...props
}: GlassCardProps) {
    return (
        <div
            className={cn(
                "glass-card p-6 flex flex-col relative overflow-hidden",
                hoverEffect && "hover:-translate-y-1 hover:shadow-lg transition-transform duration-300",
                shine && "before:absolute before:inset-0 before:bg-gradient-to-tr before:from-white/5 before:to-transparent before:pointer-events-none",
                gradient && "after:absolute after:inset-0 after:bg-gradient-to-br after:from-white/10 after:to-transparent after:pointer-events-none dark:after:from-white/5",
                className
            )}
            {...props}
        >
            <div className="relative z-10">{children}</div>
        </div>
    )
}
