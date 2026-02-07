"use client"

import { Header } from "@/components/platform/header"
import { ProtectedRoute } from "@/components/platform/protected-route"
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
import { Card, CardContent } from "@/components/ui/card"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"

export default function AssessmentsPage() {
  return (
    <ProtectedRoute>
      <AssessmentsPageContent />
    </ProtectedRoute>
  )
}

function AssessmentsPageContent() {
  const { user } = useAuth()
  const { data: assessments, isLoading } = useSWR("assessments", () => api.getAssessments())
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<AssessmentStatus | "ALL">("ALL")

  const searchLower = search.trim().toLowerCase()
  const filteredAssessments = assessments?.filter((assessment: Assessment) => {
    const matchesStatus = statusFilter === "ALL" || assessment.status === statusFilter
    const matchesSearch =
      !searchLower ||
      assessment.id.toLowerCase().includes(searchLower) ||
      new Date(assessment.createdAt).toLocaleDateString().toLowerCase().includes(searchLower)
    return matchesStatus && matchesSearch
  })

  const canCreate = !!user

  return (
    <div className="min-h-screen bg-background">
      <Header
        title="Assessments"
        description="Quality assurance assessments"
        breadcrumbs={[
          { label: "Dashboard", href: "/platform/dashboard" },
          { label: "Assessments" },
        ]}
      />

      <div className="p-4 md:p-[var(--spacing-content)] max-w-7xl mx-auto space-y-6">
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
              <Card key={i} className="border-border shadow-sm">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAssessments?.length === 0 ? (
          <Empty className="bg-card border border-border rounded-xl py-16 border-solid shadow-sm">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ClipboardList className="size-6 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>No assessments found</EmptyTitle>
              <EmptyDescription>
                {statusFilter !== "ALL" ? "Try adjusting your filters" : "Get started by creating your first assessment"}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              {canCreate && statusFilter === "ALL" && (
                <Link href="/platform/assessments/new">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Assessment
                  </Button>
                </Link>
              )}
            </EmptyContent>
          </Empty>
        ) : (
          <div className="space-y-4">
            {filteredAssessments?.map((assessment: Assessment) => (
              <Link key={assessment.id} href={`/platform/assessments/${assessment.id}`}>
                <Card className="border-border shadow-sm hover:border-primary/30 transition-all group cursor-pointer">
                  <CardContent className="p-6">
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
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
