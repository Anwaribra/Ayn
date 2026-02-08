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
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
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
  Bot,
  Shield,
  Activity,
  ArrowUpRight,
  Clock,
  Zap,
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
  AreaChart,
  Area,
} from "recharts"

// ─── Bento Stat Card ────────────────────────────────────────────────────────

interface StatCardProps {
  title: string
  value: string | number
  label: string
  icon: React.ReactNode
  trend?: string
  trendUp?: boolean
  gradient: string
  isLoading?: boolean
}

function StatCard({
  title,
  value,
  label,
  icon,
  trend,
  trendUp,
  gradient,
  isLoading,
}: StatCardProps) {
  return (
    <Card className="group relative overflow-hidden border-border bg-card shadow-sm platform-card">
      {/* Decorative gradient blob */}
      <div
        className={`absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.07] blur-2xl transition-opacity group-hover:opacity-[0.12] ${gradient}`}
      />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${gradient} text-white shadow-sm`}
        >
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
            <div className="text-3xl font-bold tracking-tight text-foreground">
              {value}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-xs text-muted-foreground">{label}</p>
              {trend && (
                <Badge
                  variant="secondary"
                  className={`px-1.5 py-0 text-[10px] font-medium ${
                    trendUp
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-amber-500/10 text-amber-500"
                  }`}
                >
                  {trendUp && <ArrowUpRight className="mr-0.5 h-3 w-3" />}
                  {trend}
                </Badge>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Quick Action Card ──────────────────────────────────────────────────────

interface QuickActionCardProps {
  title: string
  description: string
  href: string
  icon: React.ReactNode
  gradient: string
}

function QuickActionCard({
  title,
  description,
  href,
  icon,
  gradient,
}: QuickActionCardProps) {
  return (
    <Link href={href}>
      <Card className="group h-full cursor-pointer border-border bg-card shadow-sm transition-all hover:border-border/80 hover:shadow-md platform-card">
        <CardContent className="flex items-center gap-4 p-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${gradient} text-white shadow-sm transition-transform group-hover:scale-105`}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-1" />
        </CardContent>
      </Card>
    </Link>
  )
}

// ─── Progress Gauge ─────────────────────────────────────────────────────────

function ProgressGauge({ value }: { value: number }) {
  const color =
    value >= 70
      ? "var(--brand)"
      : value >= 40
        ? "oklch(0.75 0.15 75)"
        : "oklch(0.6 0.2 25)"
  const data = [{ name: "Progress", value, fill: color }]

  return (
    <div className="relative mx-auto h-44 w-44">
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
        <span className="text-4xl font-bold tracking-tight">
          {value.toFixed(0)}
        </span>
        <span className="text-sm text-muted-foreground">% complete</span>
      </div>
    </div>
  )
}

// ─── Mini Compliance Trend Chart ────────────────────────────────────────────

function ComplianceTrend() {
  // Simulated trend data - in production, this would come from the API
  const trendData = [
    { month: "Jan", score: 35 },
    { month: "Feb", score: 42 },
    { month: "Mar", score: 48 },
    { month: "Apr", score: 55 },
    { month: "May", score: 60 },
    { month: "Jun", score: 68 },
  ]

  return (
    <div className="h-44">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={trendData}>
          <defs>
            <linearGradient id="brandGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            domain={[0, 100]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              color: "hsl(var(--foreground))",
              fontSize: "12px",
            }}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="var(--brand)"
            strokeWidth={2}
            fill="url(#brandGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────

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
    () => api.getDashboardMetrics(),
  )

  const progress = metrics?.assessmentProgressPercentage ?? 0

  const stats: StatCardProps[] = [
    {
      title: "Completed Criteria",
      value: metrics?.completedCriteriaCount ?? 0,
      label: "Criteria met",
      icon: <CheckCircle2 className="h-4 w-4" />,
      gradient: "bg-emerald-500",
      trend: "+12%",
      trendUp: true,
      isLoading,
    },
    {
      title: "Evidence Files",
      value: metrics?.evidenceCount ?? 0,
      label: "Uploaded files",
      icon: <FileText className="h-4 w-4" />,
      gradient: "bg-blue-500",
      trend: "On track",
      trendUp: true,
      isLoading,
    },
    {
      title: "Progress",
      value: `${progress.toFixed(1)}%`,
      label: "Assessment completion",
      icon: <TrendingUp className="h-4 w-4" />,
      gradient: "bg-gradient-to-br from-[var(--brand)] to-emerald-600",
      isLoading,
    },
    {
      title: "Total Assessments",
      value: metrics?.totalAssessments ?? 0,
      label: "Assessments",
      icon: <ClipboardList className="h-4 w-4" />,
      gradient: "bg-purple-500",
      isLoading,
    },
  ]

  const quickActions: QuickActionCardProps[] = [
    {
      title: "New Assessment",
      description: "Create a new quality assessment",
      href: "/platform/assessments/new",
      icon: <Plus className="h-5 w-5" />,
      gradient: "bg-blue-500",
    },
    {
      title: "Upload Evidence",
      description: "Add documentation files",
      href: "/platform/evidence/upload",
      icon: <Upload className="h-5 w-5" />,
      gradient: "bg-emerald-500",
    },
    {
      title: "Gap Analysis",
      description: "AI-powered compliance analysis",
      href: "/platform/gap-analysis",
      icon: <BarChart3 className="h-5 w-5" />,
      gradient: "bg-amber-500",
    },
    {
      title: "Horus AI",
      description: "Ask your QA advisor",
      href: "/platform/horus-ai",
      icon: <Bot className="h-5 w-5" />,
      gradient: "bg-gradient-to-br from-purple-500 to-violet-600",
    },
  ]

  // Chart data based on real metrics
  const chartData = [
    { name: "Criteria", value: metrics?.completedCriteriaCount ?? 0 },
    { name: "Evidence", value: metrics?.evidenceCount ?? 0 },
    { name: "Assessments", value: metrics?.totalAssessments ?? 0 },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden border-b border-border/50 bg-gradient-to-r from-[var(--brand)]/5 via-transparent to-purple-500/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[var(--brand)]/10 via-transparent to-transparent" />
        <div className="relative px-4 py-8 md:px-6">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand)]/10">
                  <Shield className="h-4 w-4 text-[var(--brand)]" />
                </div>
                <Badge
                  variant="secondary"
                  className="bg-[var(--brand)]/10 text-[var(--brand)] border-0"
                >
                  Quality Assurance
                </Badge>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Welcome back, {user?.name?.split(" ")[0] ?? "User"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Here&apos;s an overview of your institution&apos;s quality
                assurance progress
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/platform/horus-ai">
                <Button variant="outline" size="sm" className="gap-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  Ask Horus AI
                </Button>
              </Link>
              <Link href="/platform/gap-analysis">
                <Button size="sm" className="gap-2">
                  <Zap className="h-3.5 w-3.5" />
                  Run Analysis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-8">
        {/* Stats Grid - Bento Style */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Charts Section - Bento Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Assessment Progress */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-5 w-5 text-[var(--brand)]" />
                Assessment Progress
              </CardTitle>
              <CardDescription>
                Overall completion towards quality goals
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="mx-auto h-44 w-44 rounded-full" />
              ) : (
                <ProgressGauge value={progress} />
              )}
            </CardContent>
          </Card>

          {/* Compliance Trend */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-5 w-5 text-[var(--brand)]" />
                Compliance Trend
              </CardTitle>
              <CardDescription>
                Quality score progression over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-44 w-full" />
              ) : (
                <ComplianceTrend />
              )}
            </CardContent>
          </Card>

          {/* Metrics Overview */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-5 w-5 text-[var(--brand)]" />
                Metrics Overview
              </CardTitle>
              <CardDescription>Key metrics at a glance</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-44 w-full" />
              ) : (
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barSize={40}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        tick={{
                          fill: "hsl(var(--muted-foreground))",
                          fontSize: 11,
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{
                          fill: "hsl(var(--muted-foreground))",
                          fontSize: 11,
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          color: "hsl(var(--foreground))",
                          fontSize: "12px",
                        }}
                      />
                      <Bar
                        dataKey="value"
                        fill="var(--brand)"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Quick Actions
            </h2>
            <Link href="/platform/assessments">
              <Button variant="ghost" size="sm" className="text-xs gap-1">
                View all
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <QuickActionCard key={action.href} {...action} />
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Recent Activity</CardTitle>
                <CardDescription>
                  Your latest updates and notifications
                </CardDescription>
              </div>
            </div>
            <CardAction>
              <Link href="/platform/assessments">
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  View All
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <ClipboardList className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                No recent activity yet
              </h3>
              <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                Start an assessment or upload evidence to see your progress
                tracked here.
              </p>
              <div className="flex gap-3">
                <Link href="/platform/assessments/new">
                  <Button size="sm" className="gap-2">
                    <Plus className="h-3.5 w-3.5" />
                    Start Assessment
                  </Button>
                </Link>
                <Link href="/platform/evidence/upload">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Upload className="h-3.5 w-3.5" />
                    Upload Evidence
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
