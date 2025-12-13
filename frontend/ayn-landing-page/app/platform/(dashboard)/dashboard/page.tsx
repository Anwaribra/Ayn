"use client"

import { Header } from "@/components/platform/header"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import useSWR from "swr"
import { CheckCircle2, FileText, TrendingUp, ClipboardList, ArrowRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

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
    },
    {
      label: "Evidence Files",
      value: metrics?.evidenceCount ?? 0,
      icon: FileText,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
    },
    {
      label: "Progress",
      value: `${(metrics?.assessmentProgressPercentage ?? 0).toFixed(1)}%`,
      icon: TrendingUp,
      color: "text-amber-400",
      bgColor: "bg-amber-400/10",
    },
    {
      label: "Total Assessments",
      value: metrics?.totalAssessments ?? 0,
      icon: ClipboardList,
      color: "text-zinc-400",
      bgColor: "bg-zinc-400/10",
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
      label: "AI Tools",
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

      <div className="p-4 md:p-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 hover:border-border/80 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <div>
                {isLoading ? (
                  <div className="h-8 w-20 bg-muted animate-pulse rounded" />
                ) : (
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                )}
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
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
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-zinc-500 to-zinc-300 rounded-full transition-all duration-500"
              style={{ width: `${metrics?.assessmentProgressPercentage ?? 0}%` }}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredActions.map((action) => (
              <Link key={action.href} href={action.href}>
                <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4 hover:bg-accent/50 transition-colors group cursor-pointer">
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
          <div className="text-center py-8 text-muted-foreground">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Your recent activity will appear here</p>
          </div>
        </div>
      </div>
    </div>
  )
}
