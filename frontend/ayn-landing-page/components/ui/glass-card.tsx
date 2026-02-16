import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: ReactNode
    className?: string
    variant?: 1 | 2 | 3 | 4
    hoverEffect?: boolean
    shine?: boolean
}

export function GlassCard({
    children,
    className,
    variant = 2,
    hoverEffect = false,
    shine = false,
    ...props
}: GlassCardProps) {
    return (
        <div
            className={cn(
                // Base glass styles handled by CSS classes to ensure consistency
                variant === 1 && "glass-layer-1",
                variant === 2 && "glass-layer-2 rounded-2xl",
                variant === 3 && "glass-layer-3 rounded-2xl",
                variant === 4 && "glass-layer-4",

                // Optional hover effects
                hoverEffect && "transition-all duration-300 hover:scale-[1.02] hover:brightness-105 hover:shadow-lg",

                // Layout
                "relative overflow-hidden",
                className
            )}
            {...props}
        >
            {shine && (
                <div className="absolute inset-0 pointer-events-none z-10 border border-white/10 rounded-[inherit] mask-image-gradient" />
            )}
            {children}
        </div>
    )
}
