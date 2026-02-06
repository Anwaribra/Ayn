"use client"

import { Header } from "@/components/platform/header"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import useSWR from "swr"
import { CheckCircle2, FileText, TrendingUp, ClipboardList, ArrowRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"

export default function DashboardPage() {
  const { user } = useAuth()
  const { data: metrics, isLoading } = useSWR(user ? "dashboard-metrics" : null, () => api.getDashboardMetrics())

  const stats = [
    {
      label: "Completed Criteria",
      value: metrics?.completedCriteriaCount ?? 0,
      icon: CheckCircle2,
      color: "text-green-400",
      bgColor: "bg-green-400/10",
      borderColor: "border-l-green-400",
    },
    {
      label: "Evidence Files",
      value: metrics?.evidenceCount ?? 0,
      icon: FileText,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
      borderColor: "border-l-blue-400",
    },
    {
      label: "Progress",
      value: `${(metrics?.assessmentProgressPercentage ?? 0).toFixed(1)}%`,
      icon: TrendingUp,
      color: "text-amber-400",
      bgColor: "bg-amber-400/10",
      borderColor: "border-l-amber-400",
    },
    {
      label: "Total Assessments",
      value: metrics?.totalAssessments ?? 0,
      icon: ClipboardList,
      color: "text-zinc-400",
      bgColor: "bg-zinc-400/10",
      borderColor: "border-l-zinc-400",
    },
  ]

  const quickActions = [
    {
      label: "New Assessment",
      href: "/platform/assessments/new",
      icon: Plus,
      roles: ["ADMIN", "INSTITUTION_ADMIN", "TEACHER"],
    },
    {
      label: "Upload Evidence",
      href: "/platform/evidence/upload",
      icon: FileText,
      roles: ["ADMIN", "INSTITUTION_ADMIN", "TEACHER"],
    },
    {
      label: "View Standards",
      href: "/platform/standards",
      icon: CheckCircle2,
      roles: ["ADMIN", "INSTITUTION_ADMIN", "TEACHER", "AUDITOR"],
    },
    {
      label: "Horus AI",
      href: "/platform/ai-tools",
      icon: TrendingUp,
      roles: ["ADMIN", "TEACHER", "AUDITOR"],
    },
  ]

  const filteredActions = quickActions.filter((action) => user && action.roles.includes(user.role))

  return (
    <div className="min-h-screen">
      <Header
        title={`Welcome back, ${user?.name?.split(" ")[0] ?? "User"}`}
        description="Here's an overview of your quality assurance progress"
      />

      <div className="p-4 md:p-[var(--spacing-content)] space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={cn(
                "bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-300 group relative overflow-hidden border-l-4",
                stat.borderColor,
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <div>
                {isLoading ? (
                  <div className="space-y-2">
                    <div className="h-10 w-28 bg-muted rounded-lg overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                    </div>
                    <div className="h-3 w-20 bg-muted/50 rounded" />
                  </div>
                ) : (
                  <>
                    <p className="text-4xl font-bold tracking-tight text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1.5">{stat.label}</p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Assessment Progress</h3>
            <span className="text-2xl font-bold text-foreground">
              {(metrics?.assessmentProgressPercentage ?? 0).toFixed(1)}%
            </span>
          </div>
          <div
            className="h-3 bg-muted rounded-full overflow-hidden relative"
            role="progressbar"
            aria-valuenow={metrics?.assessmentProgressPercentage ?? 0}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Assessment completion progress"
          >
            <div
              className="h-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-400 rounded-full transition-all duration-700 ease-out relative overflow-hidden"
              style={{ width: `${metrics?.assessmentProgressPercentage ?? 0}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredActions.map((action) => (
              <Link key={action.href} href={action.href}>
                <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-5 hover:bg-accent/50 hover:border-primary/30 transition-all duration-200 group cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <action.icon className="w-5 h-5 text-foreground" />
                      </div>
                      <span className="font-medium text-foreground">{action.label}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
            <Link href="/platform/assessments">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          <Empty className="py-12 border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ClipboardList className="size-6 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>No recent activity yet</EmptyTitle>
              <EmptyDescription>Start an assessment to see your progress here</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Link href="/platform/assessments/new">
                <Button size="sm" variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Start Assessment
                </Button>
              </Link>
            </EmptyContent>
          </Empty>
        </div>
      </div>
    </div>
  )
}
