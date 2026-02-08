"use client"

import { motion } from "framer-motion"
import { Sparkles, TrendingUp, AlertCircle, Lightbulb, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface Insight {
  id: string
  type: "tip" | "warning" | "suggestion" | "trend"
  title: string
  description: string
  action?: {
    label: string
    href: string
  }
}

const mockInsights: Insight[] = [
  {
    id: "1",
    type: "tip",
    title: "Evidence Collection",
    description: "You have 3 criteria without evidence. Consider uploading supporting documents for ISO 21001 clauses 4.1, 5.2, and 7.4.",
    action: {
      label: "Upload Evidence",
      href: "/platform/evidence/upload"
    }
  },
  {
    id: "2",
    type: "trend",
    title: "Progress Update",
    description: "Your compliance score improved by 12% this month. Keep up the great work!",
  },
  {
    id: "3",
    type: "suggestion",
    title: "Gap Analysis Available",
    description: "Run an AI-powered gap analysis to identify areas for improvement before your next assessment.",
    action: {
      label: "Run Analysis",
      href: "/platform/gap-analysis"
    }
  }
]

const insightIcons = {
  tip: Lightbulb,
  warning: AlertCircle,
  suggestion: Sparkles,
  trend: TrendingUp,
}

const insightColors = {
  tip: "text-amber-500 bg-amber-500/10",
  warning: "text-red-500 bg-red-500/10",
  suggestion: "text-[var(--brand)] bg-[var(--brand)]/10",
  trend: "text-emerald-500 bg-emerald-500/10",
}

export function AIInsightsCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="border-border bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand)]/10">
              <Sparkles className="h-4 w-4 text-[var(--brand)]" />
            </div>
            <div>
              <CardTitle className="text-base">AI Insights</CardTitle>
              <p className="text-xs text-muted-foreground">
                Personalized recommendations from Horus AI
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {mockInsights.map((insight, index) => {
            const Icon = insightIcons[insight.type]
            const colors = insightColors[insight.type]
            
            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className={cn(
                  "flex gap-3 p-3 rounded-lg border transition-colors",
                  "hover:bg-accent/50 border-border/50"
                )}
              >
                <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", colors)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground">
                    {insight.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {insight.description}
                  </p>
                  {insight.action && (
                    <Link href={insight.action.href}>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 mt-2 px-2 text-xs gap-1 text-[var(--brand)] hover:text-[var(--brand)] hover:bg-[var(--brand)]/10"
                      >
                        {insight.action.label}
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  )}
                </div>
              </motion.div>
            )
          })}
        </CardContent>
      </Card>
    </motion.div>
  )
}
