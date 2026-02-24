import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface GlassPanelProps {
    children: ReactNode
    className?: string
    hoverEffect?: boolean
}

export function GlassPanel({ children, className, hoverEffect = false }: GlassPanelProps) {
    return (
        <div
            className={cn(
                "glass rounded-3xl p-6 transition-all duration-300",
                hoverEffect && "hover:-translate-y-1 hover:shadow-lg hover:border-border",
                className
            )}
        >
            {children}
        </div>
    )
}
