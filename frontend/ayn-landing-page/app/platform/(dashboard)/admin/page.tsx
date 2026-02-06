"use client"

import { Header } from "@/components/platform/header"
import { api } from "@/lib/api"
import { ProtectedRoute } from "@/components/platform/protected-route"
import useSWR from "swr"
import { Building2, Users, BookOpen, ClipboardList, FileText, Settings, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function AdminPage() {
  const { data: metrics } = useSWR("dashboard-metrics", () => api.getDashboardMetrics())
  const { data: institutions } = useSWR("institutions", () => api.getInstitutions())
  const { data: standards } = useSWR("standards", () => api.getStandards())

  const adminCards = [
    {
      title: "Institutions",
      description: "Manage educational institutions",
      href: "/platform/institutions",
      icon: Building2,
      count: institutions?.length ?? 0,
    },
    {
      title: "Users",
      description: "Manage platform users",
      href: "/platform/admin/users",
      icon: Users,
      count: null,
    },
    {
      title: "Standards",
      description: "Manage quality standards",
      href: "/platform/standards",
      icon: BookOpen,
      count: standards?.length ?? 0,
    },
    {
      title: "Assessments",
      description: "View all assessments",
      href: "/platform/assessments",
      icon: ClipboardList,
      count: metrics?.totalAssessments ?? 0,
    },
    {
      title: "Evidence",
      description: "Manage evidence files",
      href: "/platform/evidence",
      icon: FileText,
      count: metrics?.evidenceCount ?? 0,
    },
    {
      title: "System Settings",
      description: "Configure platform settings",
      href: "/platform/admin/settings",
      icon: Settings,
      count: null,
    },
  ]

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <div className="min-h-screen">
        <Header title="Admin Panel" description="Platform administration and management" />

        <div className="p-4 md:p-[var(--spacing-content)] space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4">
              <p className="text-sm text-muted-foreground">Institutions</p>
              <p className="text-2xl font-bold text-foreground">{institutions?.length ?? 0}</p>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4">
              <p className="text-sm text-muted-foreground">Standards</p>
              <p className="text-2xl font-bold text-foreground">{standards?.length ?? 0}</p>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4">
              <p className="text-sm text-muted-foreground">Assessments</p>
              <p className="text-2xl font-bold text-foreground">{metrics?.totalAssessments ?? 0}</p>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4">
              <p className="text-sm text-muted-foreground">Evidence Files</p>
              <p className="text-2xl font-bold text-foreground">{metrics?.evidenceCount ?? 0}</p>
            </div>
          </div>

          {/* Admin Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminCards.map((card) => (
              <Link key={card.href} href={card.href}>
                <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 hover:border-foreground/20 transition-all group cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <card.icon className="w-6 h-6 text-foreground" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">{card.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{card.description}</p>
                  {card.count !== null && <p className="text-sm font-medium text-foreground">{card.count} total</p>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
