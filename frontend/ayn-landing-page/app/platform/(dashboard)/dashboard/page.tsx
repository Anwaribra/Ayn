"use client"

import { Header } from "@/components/platform/header"
import { ProtectedRoute } from "@/components/platform/protected-route"
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
  BarChart3,
  Target,
  Upload,
} from "lucide-react"
import Link from "next/link"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
} from "recharts"

// ─── Sub-components ─────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string
  value: string | number
  label: string
  icon: React.ReactNode
  iconColor?: string
  isLoading?: boolean
}

function StatCard({ title, value, label, icon, iconColor = "text-muted-foreground", isLoading }: StatCardProps) {
  return (
    <Card className="border-border bg-card shadow-sm platform-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`h-8 w-8 rounded-lg bg-accent flex items-center justify-center ${iconColor}`}>
          {icon}
        </div>
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
  description: string
  href: string
  icon: React.ReactNode
  color: string
}

function QuickActionCard({ title, description, href, icon, color }: QuickActionCardProps) {
  return (
    <Link href={href}>
      <Card className="hover:bg-accent/50 transition-all cursor-pointer border-border bg-card shadow-sm platform-card h-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color}`}>
              {icon}
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{description}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    </Link>
  )
}

// ─── Progress Chart ──────────────────────────────────────────────────────────

function ProgressGauge({ value }: { value: number }) {
  const data = [
    {
      name: "Progress",
      value,
      fill: value >= 70 ? "var(--brand)" : value >= 40 ? "oklch(0.75 0.15 75)" : "oklch(0.6 0.2 25)",
    },
  ]

  return (
    <div className="h-48 w-48 mx-auto relative">
      <ResponsiveContainer>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="72%"
          outerRadius="100%"
          startAngle={180}
          endAngle={0}
          data={data}
        >
          <RadialBar
            dataKey="value"
            cornerRadius={12}
            background={{ fill: "hsl(var(--muted))" }}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
        <span className="text-3xl font-bold">{value.toFixed(0)}</span>
        <span className="text-sm text-muted-foreground">% complete</span>
      </div>
    </div>
  )
}

// ─── Main Dashboard Page ────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}

function DashboardContent() {
  const { user } = useAuth()
  const { data: metrics, isLoading } = useSWR(
    user ? "dashboard-metrics" : null,
    () => api.getDashboardMetrics()
  )

  const progress = metrics?.assessmentProgressPercentage ?? 0

  const stats = [
    {
      title: "Completed Criteria",
      value: metrics?.completedCriteriaCount ?? 0,
      label: "Criteria met",
      icon: <CheckCircle2 className="h-4 w-4" />,
      iconColor: "text-emerald-500",
    },
    {
      title: "Evidence Files",
      value: metrics?.evidenceCount ?? 0,
      label: "Uploaded files",
      icon: <FileText className="h-4 w-4" />,
      iconColor: "text-blue-500",
    },
    {
      title: "Progress",
      value: `${progress.toFixed(1)}%`,
      label: "Assessment completion",
      icon: <TrendingUp className="h-4 w-4" />,
      iconColor: "text-[var(--brand)]",
    },
    {
      title: "Total Assessments",
      value: metrics?.totalAssessments ?? 0,
      label: "Assessments",
      icon: <ClipboardList className="h-4 w-4" />,
      iconColor: "text-purple-500",
    },
  ]

  const quickActions = [
    {
      title: "New Assessment",
      description: "Create a new quality assessment",
      href: "/platform/assessments/new",
      icon: <Plus className="h-5 w-5 text-blue-500" />,
      color: "bg-blue-500/10",
    },
    {
      title: "Upload Evidence",
      description: "Add documentation files",
      href: "/platform/evidence/upload",
      icon: <Upload className="h-5 w-5 text-emerald-500" />,
      color: "bg-emerald-500/10",
    },
    {
      title: "Gap Analysis",
      description: "AI-powered compliance analysis",
      href: "/platform/gap-analysis",
      icon: <BarChart3 className="h-5 w-5 text-amber-500" />,
      color: "bg-amber-500/10",
    },
    {
      title: "Horus AI",
      description: "Ask your QA advisor",
      href: "/platform/horus-ai",
      icon: <Sparkles className="h-5 w-5 text-purple-500" />,
      color: "bg-purple-500/10",
    },
  ]

  // Fake chart data based on real metrics for visual appeal
  const chartData = [
    { name: "Criteria", value: metrics?.completedCriteriaCount ?? 0 },
    { name: "Evidence", value: metrics?.evidenceCount ?? 0 },
    { name: "Assessments", value: metrics?.totalAssessments ?? 0 },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header
        title={`Welcome back, ${user?.name?.split(" ")[0] ?? "User"}`}
        description="Here's an overview of your quality assurance progress"
        breadcrumbs={[{ label: "Dashboard" }]}
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
              iconColor={stat.iconColor}
              isLoading={isLoading}
            />
          ))}
        </div>

        {/* Progress Section with Chart */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-[var(--brand)]" />
                Assessment Progress
              </CardTitle>
              <CardDescription>
                Overall completion towards quality assurance goals
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-48 w-48 mx-auto rounded-full" />
              ) : (
                <ProgressGauge value={progress} />
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[var(--brand)]" />
                Overview
              </CardTitle>
              <CardDescription>
                Key metrics at a glance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barSize={40}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                      />
                      <YAxis
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                      <Bar dataKey="value" fill="var(--brand)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <QuickActionCard
                key={action.href}
                title={action.title}
                description={action.description}
                href={action.href}
                icon={action.icon}
                color={action.color}
              />
            ))}
          </div>
        </div>

        {/* Recent Activity */}
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
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
                <ClipboardList className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No recent activity yet</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                Start an assessment to see your progress here.
              </p>
              <Link href="/platform/assessments/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Start Assessment
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
