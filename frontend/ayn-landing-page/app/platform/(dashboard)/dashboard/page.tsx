"use client"

import { Header } from "@/components/platform/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import {
  ArrowRight,
  BookCheck,
  CalendarClock,
  ClipboardCheck,
  FolderArchive,
  Sparkles,
  TrendingUp,
} from "lucide-react"

const quickActions = [
  {
    title: "Launch new assessment",
    description: "Create a fresh evaluation cycle for a selected institution.",
    href: "/platform/assessments/new",
    icon: ClipboardCheck,
  },
  {
    title: "Upload evidence",
    description: "Centralize documents and map them to standards quickly.",
    href: "/platform/evidence/upload",
    icon: FolderArchive,
  },
  {
    title: "Review standards map",
    description: "Keep ISO 21001 & NAQAAE mappings aligned and current.",
    href: "/platform/standards",
    icon: BookCheck,
  },
]

const milestones = [
  {
    title: "Self-assessment cycle closes",
    date: "Apr 18",
    status: "In progress",
    owner: "Quality Office",
  },
  {
    title: "Evidence review workshop",
    date: "Apr 28",
    status: "Scheduled",
    owner: "Review Committee",
  },
  {
    title: "External audit readiness check",
    date: "May 08",
    status: "Upcoming",
    owner: "Accreditation Lead",
  },
]

export default function DashboardPage() {
  return (
    <div className="min-h-screen">
      <Header
        title="Accreditation Command Center"
        description="Track readiness signals, evidence flow, and review milestones at a glance."
        actions={
          <>
            <Link href="/platform/assessments/new">
              <Button size="sm">New assessment</Button>
            </Link>
            <Link href="/platform/evidence/upload">
              <Button size="sm" variant="outline">
                Upload evidence
              </Button>
            </Link>
          </>
        }
      />

      <div className="p-4 md:p-[var(--spacing-content)] space-y-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="border-border/60 bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Accreditation readiness
              </CardTitle>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-semibold text-foreground">82%</p>
                  <p className="text-xs text-muted-foreground">+6% in the last 30 days</p>
                </div>
                <Badge variant="secondary">On track</Badge>
              </div>
              <Progress value={82} className="h-2" />
              <p className="text-xs text-muted-foreground">
                9 standards fully mapped, 4 require evidence refresh.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Evidence health
              </CardTitle>
              <FolderArchive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-semibold text-foreground">246</p>
                  <p className="text-xs text-muted-foreground">Artifacts cataloged</p>
                </div>
                <Badge variant="outline">12 pending review</Badge>
              </div>
              <Progress value={68} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Evidence freshness at 68%, focus on policy updates this week.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Review momentum
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-semibold text-foreground">14</p>
                  <p className="text-xs text-muted-foreground">Active reviews</p>
                </div>
                <Badge variant="secondary">+3 this week</Badge>
              </div>
              <Progress value={54} className="h-2" />
              <p className="text-xs text-muted-foreground">
                3 assessments awaiting reviewer feedback.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-border/60 bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Priority actions
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {quickActions.map((action) => (
                <Link key={action.title} href={action.href} className="group">
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/20 p-4 transition-colors group-hover:bg-muted/40">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <action.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{action.title}</p>
                        <p className="text-xs text-muted-foreground">{action.description}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Upcoming milestones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {milestones.map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
                    <CalendarClock className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <Badge variant="outline" className="text-[10px]">
                        {item.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {item.date} · Owner: {item.owner}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
