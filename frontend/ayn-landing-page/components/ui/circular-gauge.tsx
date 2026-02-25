"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface CircularGaugeProps {
    value: number
    max?: number
    label: string
    sublabel?: string
    color?: string
    icon?: React.ReactNode
    className?: string
}

export function CircularGauge({
    value,
    max = 100,
    label,
    sublabel,
    color = "var(--brand)",
    icon,
    className,
}: CircularGaugeProps) {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
    const radius = 40
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    return (
        <div 
            className={cn("relative flex items-center justify-center", className)}
            role="img"
            aria-label={`${label}: ${value}${sublabel ? ' ' + sublabel : ''}`}
        >
            {/* SVG Container */}
            <div className="relative w-32 h-32" aria-hidden="true">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
                    {/* Background Ring */}
                    <circle
                        cx="48"
                        cy="48"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-white/5"
                    />
                    {/* Progress Ring */}
                    <motion.circle
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        cx="48"
                        cy="48"
                        r={radius}
                        stroke={color}
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeLinecap="round"
                        className="filter drop-shadow-[0_0_4px_rgba(255,255,255,0.2)]"
                    />
                </svg>

                {/* Inner Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    {icon && <div className="mb-1 text-white/80">{icon}</div>}
                    <span className="text-xl font-bold tracking-tight">{value}{sublabel && <span className="text-xs font-normal text-muted-foreground ml-0.5">{sublabel}</span>}</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
                </div>
            </div>
        </div>
    )
}
