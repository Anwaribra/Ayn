"use client"

import { Header } from "@/components/platform/header"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import useSWR from "swr"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  CheckCircle2,
  FileText,
  TrendingUp,
  ClipboardList,
  ArrowRight,
  Plus,
  Sparkles,
} from "lucide-react"
import Link from "next/link"

interface StatCardProps {
  title: string
  value: string | number
  label: string
  icon: React.ReactNode
  isLoading?: boolean
}

function StatCard({ title, value, label, icon, isLoading }: StatCardProps) {
  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold text-foreground">{value}</div>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

interface QuickActionCardProps {
  title: string
  href: string
  icon: React.ReactNode
}

function QuickActionCard({ title, href, icon }: QuickActionCardProps) {
  return (
    <Link href={href}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer border-border bg-card shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                {icon}
              </div>
              <CardTitle className="text-base font-medium">{title}</CardTitle>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </div>
        </CardHeader>
      </Card>
    </Link>
  )
}

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  actionLabel: string
  actionHref: string
}

function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">{description}</p>
      <Link href={actionHref}>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {actionLabel}
        </Button>
      </Link>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { data: metrics, isLoading } = useSWR(user ? "dashboard-metrics" : null, () =>
    api.getDashboardMetrics(),
  )

  const progress = metrics?.assessmentProgressPercentage ?? 0

  const stats = [
    {
      title: "Completed Criteria",
      value: metrics?.completedCriteriaCount ?? 0,
      label: "Criteria met",
      icon: <CheckCircle2 className="h-4 w-4" />,
    },
    {
      title: "Evidence Files",
      value: metrics?.evidenceCount ?? 0,
      label: "Uploaded files",
      icon: <FileText className="h-4 w-4" />,
    },
    {
      title: "Progress",
      value: `${progress.toFixed(1)}%`,
      label: "Assessment completion",
      icon: <TrendingUp className="h-4 w-4" />,
    },
    {
      title: "Total Assessments",
      value: metrics?.totalAssessments ?? 0,
      label: "Assessments",
      icon: <ClipboardList className="h-4 w-4" />,
    },
  ]

  const quickActions = [
    {
      title: "New Assessment",
      href: "/platform/assessments/new",
      icon: <Plus className="h-5 w-5" />,
      roles: ["ADMIN", "INSTITUTION_ADMIN", "TEACHER"],
    },
    {
      title: "Upload Evidence",
      href: "/platform/evidence/upload",
      icon: <FileText className="h-5 w-5" />,
      roles: ["ADMIN", "INSTITUTION_ADMIN", "TEACHER"],
    },
    {
      title: "View Standards",
      href: "/platform/standards",
      icon: <CheckCircle2 className="h-5 w-5" />,
      roles: ["ADMIN", "INSTITUTION_ADMIN", "TEACHER", "AUDITOR"],
    },
    {
      title: "Horus AI",
      href: "/platform/ai-tools",
      icon: <Sparkles className="h-5 w-5" />,
      roles: ["ADMIN", "INSTITUTION_ADMIN", "TEACHER", "AUDITOR"],
    },
  ]

  const filteredActions = quickActions.filter(
    (action) => user && action.roles.includes(user.role),
  )

  return (
    <div className="min-h-screen bg-background">
      <Header
        title={`Welcome back, ${user?.name?.split(" ")[0] ?? "User"}`}
        description="Here's an overview of your quality assurance progress"
      />

      <div className="p-4 md:p-[var(--spacing-content)] max-w-7xl mx-auto space-y-8">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              label={stat.label}
              icon={stat.icon}
              isLoading={isLoading}
            />
          ))}
        </div>

        {/* Progress Section - bundle style with Card + Progress */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Assessment Progress</CardTitle>
            <CardDescription>
              Track your progress towards quality assurance goals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">
                  Completion
                </span>
                <span className="text-muted-foreground">
                  {progress.toFixed(1)}% complete
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions - bundle style QuickActionCard */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Quick Actions
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {filteredActions.map((action) => (
              <QuickActionCard
                key={action.href}
                title={action.title}
                href={action.href}
                icon={action.icon}
              />
            ))}
          </div>
        </div>

        {/* Recent Activity - bundle style Card + EmptyState */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="border-b border-border pb-6">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your latest updates and notifications
              </CardDescription>
            </div>
            <CardAction>
              <Link href="/platform/assessments">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={<ClipboardList className="h-8 w-8" />}
              title="No recent activity yet"
              description="Start an assessment to see your progress here."
              actionLabel="Start Assessment"
              actionHref="/platform/assessments/new"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
