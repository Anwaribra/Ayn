import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface GlassCardProps {
    children: ReactNode
    className?: string
    gradient?: boolean
}

export function GlassCard({ children, className, gradient = false }: GlassCardProps) {
    return (
        <div
            className={cn(
                "glass-card p-6 flex flex-col relative overflow-hidden",
                gradient && "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:pointer-events-none dark:before:from-white/5",
                className
            )}
        >
            <div className="relative z-10">{children}</div>
        </div>
    )
}
