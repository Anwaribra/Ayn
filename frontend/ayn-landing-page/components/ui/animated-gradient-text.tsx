"use client"

import { cn } from "@/lib/utils"

interface AnimatedGradientTextProps {
    children: React.ReactNode
    className?: string
}

export function AnimatedGradientText({ children, className }: AnimatedGradientTextProps) {
    return (
        <span
            className={cn(
                "bg-gradient-to-r from-zinc-100 via-zinc-400 to-zinc-100 bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient",
                className
            )}
        >
            {children}
        </span>
    )
}
