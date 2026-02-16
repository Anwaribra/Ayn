"use client"

import { CheckCircle2, Circle, Clock, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Step {
    id: string
    label: string
    status: "completed" | "current" | "pending"
    date?: string
}

interface WorkflowTimelineProps {
    steps?: Step[]
    className?: string
}

export function WorkflowTimeline({ steps: customSteps, className }: WorkflowTimelineProps) {
    const defaultSteps: Step[] = [
        { id: "1", label: "Gap Analysis", status: "completed", date: "Feb 10" },
        { id: "2", label: "Evidence Collection", status: "current", date: "In Progress" },
        { id: "3", label: "Self-Study Report", status: "pending" },
        { id: "4", label: "External Audit", status: "pending" },
    ]

    const steps = customSteps || defaultSteps

    return (
        <div className={cn("w-full py-6", className)}>
            <div className="relative flex items-center justify-between">
                {/* Connector Line */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-muted -z-10" />

                {steps.map((step, index) => (
                    <div key={step.id} className="relative flex flex-col items-center group cursor-pointer">
                        <div
                            className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 relative z-10",
                                step.status === "completed" && "text-primary-foreground",
                                step.status === "current" && "bg-card border-primary text-primary shadow-lg scale-110",
                                step.status === "pending" && "bg-muted border-border text-muted-foreground"
                            )}
                            style={step.status === "completed" ? { backgroundColor: "var(--status-success)", borderColor: "var(--status-success-border)" } : undefined}
                        >
                            {step.status === "completed" && <CheckCircle2 className="w-5 h-5" />}
                            {step.status === "current" && <Clock className="w-5 h-5 animate-pulse" />}
                            {step.status === "pending" && <Circle className="w-5 h-5" />}
                        </div>

                        <div className="absolute top-12 flex flex-col items-center w-32 text-center">
                            <span className={cn(
                                "text-xs font-bold transition-colors",
                                step.status === "current" ? "text-primary" :
                                    step.status === "completed" ? "text-foreground" : "text-muted-foreground"
                            )}>
                                {step.label}
                            </span>
                            {step.date && (
                                <span className="text-[10px] text-muted-foreground font-medium mt-0.5">{step.date}</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
