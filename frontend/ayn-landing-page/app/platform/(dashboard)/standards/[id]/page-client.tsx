"use client"

import { Header } from "@/components/platform/header"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import useSWR from "swr"
import { useParams } from "next/navigation"
import { BookOpen, ArrowLeft, Edit, Plus, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { Criterion } from "@/lib/types"

export function StandardDetailPageClient() {
  const { id } = useParams()
  const { user } = useAuth()
  const { data: standard, isLoading: loadingStandard } = useSWR(id ? `standard-${id}` : null, () =>
    api.getStandard(id as string),
  )
  const { data: criteria, isLoading: loadingCriteria } = useSWR(id ? `criteria-${id}` : null, () =>
    api.getCriteria(id as string),
  )

  const isAdmin = user?.role === "ADMIN"
  const isLoading = loadingStandard || loadingCriteria

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header title="Loading..." />
        <div className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        </div>
      </div>
    )
  }

  if (!standard) {
    return (
      <div className="min-h-screen">
        <Header title="Standard Not Found" />
        <div className="p-8 text-center">
          <p className="text-muted-foreground mb-4">The standard you're looking for doesn't exist.</p>
          <Link href="/platform/standards">
            <Button>Back to Standards</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header title={standard.title} description={standard.description || undefined} />

      <div className="p-4 md:p-8 space-y-6">
        <Link
          href="/platform/standards"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to standards
        </Link>

        {/* Standard Info Card */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <BookOpen className="w-8 h-8 text-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">{standard.title}</h2>
                <p className="text-muted-foreground">{standard.description || "No description"}</p>
              </div>
            </div>
            {isAdmin && (
              <Link href={`/platform/standards/${id}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Criteria List */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Criteria ({criteria?.length ?? 0})</h3>
            {isAdmin && (
              <Link href={`/platform/standards/${id}/criteria/new`}>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Criterion
                </Button>
              </Link>
            )}
          </div>

          {!criteria || criteria.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No criteria defined yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {criteria.map((criterion: Criterion, index: number) => (
                <div
                  key={criterion.id}
                  className="p-4 bg-muted/30 rounded-lg border border-border hover:border-foreground/20 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-medium text-foreground">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{criterion.title}</h4>
                      {criterion.description && (
                        <p className="text-sm text-muted-foreground mt-1">{criterion.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}










