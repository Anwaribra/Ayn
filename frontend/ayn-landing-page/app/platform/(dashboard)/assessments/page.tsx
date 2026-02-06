"use client"

import { Header } from "@/components/platform/header"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import useSWR from "swr"
import { ClipboardList, Plus, Search, ArrowRight, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useState } from "react"
import type { Assessment, AssessmentStatus } from "@/lib/types"
import { StatusBadge } from "@/components/platform/status-badge"

export default function AssessmentsPage() {
  const { user } = useAuth()
  const { data: assessments, isLoading } = useSWR("assessments", () => api.getAssessments())
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<AssessmentStatus | "ALL">("ALL")

  const filteredAssessments = assessments?.filter((assessment: Assessment) => {
    const matchesStatus = statusFilter === "ALL" || assessment.status === statusFilter
    return matchesStatus
  })

  const canCreate = user?.role === "ADMIN" || user?.role === "INSTITUTION_ADMIN" || user?.role === "TEACHER"

  return (
    <div className="min-h-screen">
      <Header
        title="Assessments"
        description="Quality assurance assessments"
        breadcrumbs={[
          { label: "Dashboard", href: "/platform/dashboard" },
          { label: "Assessments" },
        ]}
      />

      <div className="p-4 md:p-8 space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search assessments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-background/50"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as AssessmentStatus | "ALL")}>
              <SelectTrigger className="w-full sm:w-40 bg-background/50">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="REVIEWED">Reviewed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {canCreate && (
            <Link href="/platform/assessments/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Assessment
              </Button>
            </Link>
          )}
        </div>

        {/* Assessments List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-card/50 border border-border rounded-xl p-6 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-5 bg-muted rounded w-48" />
                    <div className="h-4 bg-muted rounded w-32" />
                  </div>
                  <div className="h-6 bg-muted rounded w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredAssessments?.length === 0 ? (
          <div className="text-center py-16 bg-card/50 border border-border rounded-xl">
            <ClipboardList className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No assessments found</h3>
            <p className="text-muted-foreground mb-4">
              {statusFilter !== "ALL" ? "Try adjusting your filters" : "Get started by creating your first assessment"}
            </p>
            {canCreate && statusFilter === "ALL" && (
              <Link href="/platform/assessments/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Assessment
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAssessments?.map((assessment: Assessment) => (
              <Link key={assessment.id} href={`/platform/assessments/${assessment.id}`}>
                <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 hover:border-foreground/20 transition-all group cursor-pointer">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-muted rounded-lg">
                        <ClipboardList className="w-5 h-5 text-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Assessment #{assessment.id.slice(0, 8)}</h3>
                        <p className="text-sm text-muted-foreground">
                          Created {new Date(assessment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <StatusBadge status={assessment.status} />
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                  {assessment.reviewerComment && (
                    <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Review:</span> {assessment.reviewerComment}
                      </p>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
